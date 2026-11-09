package com.huyberos.studymate.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.huyberos.studymate.entity.Document;
import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.User;
import com.huyberos.studymate.entity.enums.FileType;
import com.huyberos.studymate.repository.DocumentRepository;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.security.jwt.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AiReviewIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JwtUtil jwt;
    @Autowired UserRepository users;
    @Autowired SubjectRepository subjects;
    @Autowired DocumentRepository documents;

    @Test
    void ownerCanSaveReopenAndSubmitQuizButOtherAccountsCannotAccessIt() throws Exception {
        var owner = users.save(User.builder().username("ai-review-owner").fullName("Review Owner").build());
        var other = users.save(User.builder().username("ai-review-other").fullName("Other User").build());
        var subject = subjects.save(Subject.builder().user(owner).name("AI Review Test").build());
        var source = documents.save(Document.builder().subject(subject).fileName("lesson.pdf")
                .fileType(FileType.PDF).fileUrl("/uploads/test/lesson.pdf").build());
        String library = "/api/ai-outputs/subjects/" + subject.getId();
        String quizBody = """
                {"sourceType":"DOCUMENT","sourceId":%d,"title":"Quiz đã lưu","questions":[
                  {"questionText":"Câu 1","optionA":"Đúng","optionB":"Sai","optionC":"C","optionD":"D",
                   "correctOption":"A","explanation":"Giải thích mẫu"}]}
                """.formatted(source.getId());

        mvc.perform(post("/api/ai-outputs/quiz/save").header("Authorization", auth(other))
                        .contentType(MediaType.APPLICATION_JSON).content(quizBody))
                .andExpect(status().isNotFound());
        var response = mvc.perform(post("/api/ai-outputs/quiz/save").header("Authorization", auth(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(quizBody))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var quiz = mapper.readTree(response).path("data");
        long quizId = quiz.path("id").asLong();
        long questionId = quiz.path("questions").get(0).path("id").asLong();
        mvc.perform(get(library).header("Authorization", auth(owner)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.quizzes[0].id").value(quizId))
                .andExpect(jsonPath("$.data.quizzes[0].sourceId").value(source.getId()))
                .andExpect(jsonPath("$.data.quizzes[0].questions[0].correctOption").doesNotExist());
        mvc.perform(get(library).header("Authorization", auth(other))).andExpect(status().isNotFound());

        String attempt = "/api/quizzes/" + quizId + "/attempt";
        String answers = "{\"answers\":{\"" + questionId + "\":\"A\"}}";
        mvc.perform(post(attempt).header("Authorization", auth(other))
                        .contentType(MediaType.APPLICATION_JSON).content(answers))
                .andExpect(status().isNotFound());
        mvc.perform(post(attempt).header("Authorization", auth(owner))
                        .contentType(MediaType.APPLICATION_JSON).content(answers))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.score").value(1))
                .andExpect(jsonPath("$.data.details[0].explanation").value("Giải thích mẫu"));
    }

    private String auth(User user) {
        return "Bearer " + jwt.generateAccessToken(user.getId(), user.getEmail());
    }
}
