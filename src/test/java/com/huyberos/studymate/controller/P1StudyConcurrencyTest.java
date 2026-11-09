package com.huyberos.studymate.controller;

import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.AuthProvider;
import com.huyberos.studymate.exception.ConflictException;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.study.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.function.Supplier;
import static org.junit.jupiter.api.Assertions.*;

/** Independent committed transactions: an outer rollback transaction would hide lock races. */
@SpringBootTest @ActiveProfiles("p1-integration")
class P1StudyConcurrencyTest {
    @Autowired UserRepository users;
    @Autowired StudySessionService service;
    @Autowired JdbcTemplate jdbc;
    User owner;

    @BeforeEach void setup() {
        owner=users.saveAndFlush(User.builder().email("p1-race-"+UUID.randomUUID()+"@example.test").provider(AuthProvider.LOCAL).build());
    }
    @AfterEach void cleanup() {
        SecurityContextHolder.clearContext();
        Long id=owner.getId();
        jdbc.update("DELETE FROM study_mutation_receipt WHERE user_id=?",id);
        jdbc.update("DELETE FROM study_session_segment WHERE session_id IN (SELECT id FROM study_session WHERE user_id=?)",id);
        jdbc.update("DELETE FROM study_session WHERE user_id=?",id);
        jdbc.update("DELETE FROM user_study_preferences WHERE user_id=?",id);
        jdbc.update("DELETE FROM study_account_state WHERE user_id=?",id);
        jdbc.update("DELETE FROM app_user WHERE id=?",id);
    }
    private void authenticate() {
        var principal=new org.springframework.security.core.userdetails.User(owner.getEmail(),"",List.of());
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(principal,null,principal.getAuthorities()));
    }
    private List<String> race(Supplier<?> first,Supplier<?> second) throws Exception {
        var ready=new CountDownLatch(2); var start=new CountDownLatch(1);
        try(var executor=Executors.newFixedThreadPool(2)) {
            var futures=List.of(first,second).stream().map(operation -> executor.submit(() -> {
                authenticate(); ready.countDown(); start.await();
                try { operation.get(); return "ok"; } catch(ConflictException expected) { return "conflict"; }
                finally { SecurityContextHolder.clearContext(); }
            })).toList();
            assertTrue(ready.await(5,TimeUnit.SECONDS)); start.countDown();
            return List.of(futures.get(0).get(10,TimeUnit.SECONDS),futures.get(1).get(10,TimeUnit.SECONDS));
        }
    }
    private StudyDtos.CreateSession request() { return new StudyDtos.CreateSession(UUID.randomUUID(),UUID.randomUUID(),null,null,1500); }
    @Test void twoDevicesCannotCreateTwoActiveSessions() throws Exception {
        var result=race(() -> service.create(UUID.randomUUID(),request()),() -> service.create(UUID.randomUUID(),request()));
        assertEquals(1,result.stream().filter("ok"::equals).count());
        assertEquals(1,result.stream().filter("conflict"::equals).count());
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM study_session WHERE user_id=?",Integer.class,owner.getId()));
    }
    @Test void simultaneousRetriesReturnOneCommittedSessionAndReceipt() throws Exception {
        var key=UUID.randomUUID();var request=request();
        assertEquals(List.of("ok","ok"),race(() -> service.create(key,request),() -> service.create(key,request)));
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM study_session WHERE user_id=?",Integer.class,owner.getId()));
        assertEquals(1,jdbc.queryForObject("SELECT count(*) FROM study_mutation_receipt WHERE user_id=?",Integer.class,owner.getId()));
        assertEquals(1L,jdbc.queryForObject("SELECT revision FROM study_account_state WHERE user_id=?",Long.class,owner.getId()));
    }
    @Test void concurrentTransitionsRejectTheStaleVersion() throws Exception {
        authenticate();var session=service.create(UUID.randomUUID(),request()); SecurityContextHolder.clearContext();
        var transition=new StudyDtos.Transition(StudyDtos.Action.PAUSE,session.version());
        var result=race(() -> service.transition(session.publicId(),UUID.randomUUID(),transition),() -> service.transition(session.publicId(),UUID.randomUUID(),transition));
        assertEquals(1,result.stream().filter("ok"::equals).count());
        assertEquals(1,result.stream().filter("conflict"::equals).count());
        assertEquals("PAUSED",jdbc.queryForObject("SELECT status FROM study_session WHERE user_id=?",String.class,owner.getId()));
    }
}
