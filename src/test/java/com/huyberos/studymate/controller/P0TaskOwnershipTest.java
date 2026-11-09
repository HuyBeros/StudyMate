package com.huyberos.studymate.controller;

import com.huyberos.studymate.entity.Subject;
import com.huyberos.studymate.entity.enums.TaskStatus;
import com.huyberos.studymate.exception.ResourceNotFoundException;
import com.huyberos.studymate.repository.SubjectRepository;
import com.huyberos.studymate.repository.TaskRepository;
import com.huyberos.studymate.repository.UserRepository;
import com.huyberos.studymate.service.TaskService;
import com.huyberos.studymate.util.SecurityUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class P0TaskOwnershipTest {
    @Mock TaskRepository taskRepository;
    @Mock SubjectRepository subjectRepository;
    @Mock UserRepository userRepository;
    @Mock SecurityUtil securityUtil;
    @InjectMocks TaskService service;

    @Test
    void cannotReadTasksThroughAnotherUsersSubjectWithOrWithoutStatusFilter() {
        when(securityUtil.getCurrentUserId()).thenReturn(1L);
        when(subjectRepository.findByIdAndUserId(99L, 1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.getAllTasks(null, 99L));
        assertThrows(ResourceNotFoundException.class, () -> service.getAllTasks(TaskStatus.DONE, 99L));
        verifyNoInteractions(taskRepository);
    }

    @Test
    void owningSubjectStillAllowsFilteredTaskListing() {
        when(securityUtil.getCurrentUserId()).thenReturn(1L);
        when(subjectRepository.findByIdAndUserId(3L, 1L)).thenReturn(Optional.of(Subject.builder().id(3L).build()));
        when(taskRepository.findBySubjectIdAndStatus(3L, TaskStatus.DONE)).thenReturn(List.of());
        assertTrue(service.getAllTasks(TaskStatus.DONE, 3L).isEmpty());
        verify(taskRepository).findBySubjectIdAndStatus(3L, TaskStatus.DONE);
    }
}
