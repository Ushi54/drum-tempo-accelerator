package com.example.drum.bf;

import com.example.drum.bc.PresetBC;
import com.example.drum.dto.PresetRequestDto;
import com.example.drum.dto.PresetResponseDto;
import com.example.drum.entity.PresetEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PresetRegisterBF {

    @Autowired
    private PresetBC presetBC;

    @Transactional
    public PresetResponseDto execute(PresetRequestDto dto) {
        // プリセット登録
        PresetEntity preset = presetBC.registerPreset(
                dto.getUserId(),
                dto.getName(),
                dto.getStartBpm(),
                dto.getMaxBpm(),
                dto.getAccInterval(),
                dto.getAccAmount(),
                dto.getAccMode()
        );

        return new PresetResponseDto(preset.getId(), "プリセット「" + preset.getName() + "」を保存しました。");
    }
}
