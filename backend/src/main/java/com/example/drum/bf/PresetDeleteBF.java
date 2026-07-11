package com.example.drum.bf;

import com.example.drum.bc.PresetBC;
import com.example.drum.dto.PresetResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PresetDeleteBF {

    @Autowired
    private PresetBC presetBC;

    @Transactional
    public PresetResponseDto execute(String id) {
        presetBC.deletePreset(id);
        return new PresetResponseDto(id, "プリセットを削除しました。");
    }
}
