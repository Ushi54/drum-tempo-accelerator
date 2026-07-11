package com.example.drum.controller;

import com.example.drum.bf.LoginBF;
import com.example.drum.bf.SignupBF;
import com.example.drum.dto.AuthRequestDto;
import com.example.drum.dto.AuthResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*") // フロントエンドからのCORS要求を許可
public class AuthController {

    @Autowired
    private SignupBF signupBF;

    @Autowired
    private LoginBF loginBF;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponseDto> signup(@RequestBody AuthRequestDto requestDto) {
        AuthResponseDto response = signupBF.execute(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDto> login(@RequestBody AuthRequestDto requestDto) {
        AuthResponseDto response = loginBF.execute(requestDto);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<AuthResponseDto> handleException(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new AuthResponseDto(null, null, e.getMessage()));
    }
}
