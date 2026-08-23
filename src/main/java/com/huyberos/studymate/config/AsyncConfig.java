package com.huyberos.studymate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "aiTaskExecutor")
    public Executor aiTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);      // Giữ sẵn 5 thread
        executor.setMaxPoolSize(20);      // Tối đa 20 thread
        executor.setQueueCapacity(100);   // Nếu vượt quá 20, xếp hàng chờ tới 100 tác vụ
        executor.setThreadNamePrefix("ai-gen-");
        executor.initialize();
        return executor;
    }
}
