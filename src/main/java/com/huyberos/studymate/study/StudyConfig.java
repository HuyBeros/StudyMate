package com.huyberos.studymate.study;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import java.time.Clock;

@Configuration
public class StudyConfig {
    @Bean public Clock studyClock() { return Clock.systemUTC(); }
}
