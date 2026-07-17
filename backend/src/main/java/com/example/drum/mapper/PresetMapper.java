package com.example.drum.mapper;

import com.example.drum.entity.PresetEntity;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface PresetMapper {

    @Insert("INSERT INTO presets (id, user_id, name, start_bpm, max_bpm, acc_interval, acc_amount) " +
            "VALUES (#{id}, #{userId}, #{name}, #{startBpm}, #{maxBpm}, #{accInterval}, #{accAmount})")
    void insertPreset(PresetEntity preset);

    @Select("SELECT * FROM presets WHERE CAST(user_id AS VARCHAR) = #{userId} ORDER BY name ASC")
    List<PresetEntity> findByUserId(@Param("userId") String userId);

    @Delete("DELETE FROM presets WHERE id = #{id}")
    void deletePreset(@Param("id") String id);
}
