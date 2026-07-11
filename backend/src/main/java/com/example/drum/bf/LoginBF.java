package com.example.drum.bf;

import com.example.drum.bc.UserBC;
import com.example.drum.dto.AuthRequestDto;
import com.example.drum.dto.AuthResponseDto;
import com.example.drum.entity.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LoginBF {

    @Autowired
    private UserBC userBC;

    @Transactional(readOnly = true)
    public AuthResponseDto execute(AuthRequestDto dto) {
        // 1. ユーザー取得
        UserEntity user = userBC.getUserByEmail(dto.getEmail());
        if (user == null) {
            throw new IllegalArgumentException("メールアドレスまたはパスワードが正しくありません。");
        }

        // 2. パスワード照合 (簡易的に平文一致で検証)
        if (!user.getPassword().equals(dto.getPassword())) {
            throw new IllegalArgumentException("メールアドレスまたはパスワードが正しくありません。");
        }

        // 3. レスポンス返却
        return new AuthResponseDto(user.getId(), user.getEmail(), "ログインに成功しました。");
    }
}
