package com.lostandfound.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose the local "files" folder at URL path "/files/**"
        File uploadDir = new File("./files");
        if (!uploadDir.exists()) {
            uploadDir.mkdirs();
        }
        
        registry.addResourceHandler("/files/**")
                .addResourceLocations(uploadDir.getAbsoluteFile().toURI().toString());
    }
}
