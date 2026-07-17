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
        String uploadPath = uploadDir.getAbsolutePath().replace("\\", "/");
        
        registry.addResourceHandler("/files/**")
                .addResourceLocations("file:/" + uploadPath + "/");
    }
}
