package com.example.drum.bc;

import com.example.drum.entity.UserEntity;
import com.example.drum.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserBC {

    @Autowired
    private UserMapper userMapper;

    public UserEntity registerUser(String email, String password) {
        String uuid = UUID.randomUUID().toString();
        UserEntity user = new UserEntity(uuid, email, password);
        userMapper.insertUser(user);
        return user;
    }

    public UserEntity getUserByEmail(String email) {
        return userMapper.findByEmail(email);
    }
}
