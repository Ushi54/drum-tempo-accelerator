package com.example.drum.bc;

import com.example.drum.entity.PresetEntity;
import com.example.drum.mapper.PresetMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class PresetBC {

    @Autowired
    private PresetMapper presetMapper;

    public PresetEntity registerPreset(String userId, String name, int startBpm, int maxBpm, int accInterval, int accAmount, String accMode) {
        String uuid = UUID.randomUUID().toString();
        PresetEntity preset = new PresetEntity(uuid, userId, name, startBpm, maxBpm, accInterval, accAmount, accMode);
        presetMapper.insertPreset(preset);
        return preset;
    }

    public List<PresetEntity> getPresetsByUserId(String userId) {
        return presetMapper.findByUserId(userId);
    }

    public void deletePreset(String id) {
        presetMapper.deletePreset(id);
    }
}
