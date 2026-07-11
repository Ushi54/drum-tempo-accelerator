package com.example.drum.mapper;

import com.example.drum.entity.UserEntity;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {

    @Insert("INSERT INTO users (id, email, password) VALUES (#{id}, #{email}, #{password})")
    void insertUser(UserEntity user);

    @Select("SELECT * FROM users WHERE email = #{email}")
    UserEntity findByEmail(@Param("email") String email);
}
