package com.huyberos.studymate.study;

import com.huyberos.studymate.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "study_account_state") @Getter @Setter @NoArgsConstructor
public class StudyAccountState {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "study_account_state_seq")
    @SequenceGenerator(name = "study_account_state_seq", sequenceName = "study_account_state_id_seq", allocationSize = 1)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY) @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    private long revision;
}
