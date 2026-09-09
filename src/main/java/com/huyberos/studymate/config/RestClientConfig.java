package com.huyberos.studymate.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/**
 * Cấu hình RestClient dùng chung cho tất cả AI provider.
 * Thay vì mỗi client tạo RestClient.create() riêng → chia sẻ connection pool + timeout.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient aiRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);  // 10s connect timeout
        factory.setReadTimeout(60_000);     // 60s read timeout (AI APIs có thể chậm)

        return RestClient.builder()
                .requestFactory(factory)
                .build();
    }
}
