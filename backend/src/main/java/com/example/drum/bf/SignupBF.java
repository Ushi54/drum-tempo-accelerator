package com.example.drum.bf;

import com.example.drum.bc.UserBC;
import com.example.drum.dto.AuthRequestDto;
import com.example.drum.dto.AuthResponseDto;
import com.example.drum.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SignupBF {

    @Autowired
    private UserBC userBC;

    @Transactional
    public AuthResponseDto execute(AuthRequestDto dto) {
        // 1. 重複チェック
        UserEntity existingUser = userBC.getUserByEmail(dto.getEmail());
        if (existingUser != null) {
            throw new IllegalArgumentException("このメールアドレスは既に登録されています。");
        }

        // 2. ユーザー登録
        UserEntity registered = userBC.registerUser(dto.getEmail(), dto.getPassword());

        // 3. レスポンス返却
        return new AuthResponseDto(registered.getId(), registered.getEmail(), "新規アカウント登録が完了しました。");
    }
}
