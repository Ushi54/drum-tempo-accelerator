package com.example.drum.controller;

import com.example.drum.bf.PresetDeleteBF;
import com.example.drum.bf.PresetListBF;
import com.example.drum.bf.PresetRegisterBF;
import com.example.drum.dto.PresetRequestDto;
import com.example.drum.dto.PresetResponseDto;
import com.example.drum.entity.PresetEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/presets")
@CrossOrigin(origins = "*") // フロントエンドからのCORS要求を許可
public class PresetController {

    @Autowired
    private PresetRegisterBF presetRegisterBF;

    @Autowired
    private PresetListBF presetListBF;

    @Autowired
    private PresetDeleteBF presetDeleteBF;

    @PostMapping
    public ResponseEntity<PresetResponseDto> savePreset(@RequestBody PresetRequestDto requestDto) {
        PresetResponseDto response = presetRegisterBF.execute(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PresetEntity>> getPresets(@RequestParam("userId") String userId) {
        List<PresetEntity> presets = presetListBF.execute(userId);
        return ResponseEntity.ok(presets);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<PresetResponseDto> deletePreset(@PathVariable("id") String id) {
        PresetResponseDto response = presetDeleteBF.execute(id);
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<PresetResponseDto> handleException(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new PresetResponseDto(null, e.getMessage()));
    }
}
