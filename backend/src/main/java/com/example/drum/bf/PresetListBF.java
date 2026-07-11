package com.example.drum.bf;

import com.example.drum.bc.PresetBC;
import com.example.drum.entity.PresetEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PresetListBF {

    @Autowired
    private PresetBC presetBC;

    @Transactional(readOnly = true)
    public List<PresetEntity> execute(String userId) {
        return presetBC.getPresetsByUserId(userId);
    }
}
