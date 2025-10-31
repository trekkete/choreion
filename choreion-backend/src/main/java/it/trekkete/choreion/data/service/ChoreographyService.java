package it.trekkete.choreion.data.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.trekkete.choreion.data.dto.ChoreographyDTO;
import it.trekkete.choreion.data.dto.ChoreographySummaryDTO;
import it.trekkete.choreion.data.entity.Choreography;
import it.trekkete.choreion.data.repository.ChoreographyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ChoreographyService {

    @Autowired
    private ChoreographyRepository choreographyRepository;

    @Autowired
    private ObjectMapper objectMapper;

    public List<ChoreographySummaryDTO> getAllChoreographies() {
        return choreographyRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::toSummaryDTO)
                .collect(Collectors.toList());
    }

    public ChoreographyDTO getChoreographyById(Long id) {
        Choreography choreography = choreographyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Choreography not found"));
        return toDTO(choreography);
    }

    public ChoreographyDTO createChoreography(ChoreographyDTO choreographyDTO) {
        Choreography choreography = new Choreography();
        choreography.setName(choreographyDTO.getName());
        choreography.setRoutesJson(routesToJson(choreographyDTO.getRoutes()));

        Choreography saved = choreographyRepository.save(choreography);
        return toDTO(saved);
    }

    public ChoreographyDTO updateChoreography(Long id, ChoreographyDTO choreographyDTO) {
        Choreography choreography = choreographyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Choreography not found"));

        choreography.setName(choreographyDTO.getName());
        choreography.setRoutesJson(routesToJson(choreographyDTO.getRoutes()));

        Choreography updated = choreographyRepository.save(choreography);
        return toDTO(updated);
    }

    public void deleteChoreography(Long id) {
        choreographyRepository.deleteById(id);
    }

    private ChoreographyDTO toDTO(Choreography choreography) {
        ChoreographyDTO dto = new ChoreographyDTO();
        dto.setId(choreography.getId());
        dto.setName(choreography.getName());
        dto.setRoutes(jsonToRoutes(choreography.getRoutesJson()));
        dto.setCreatedAt(choreography.getCreatedAt());
        dto.setUpdatedAt(choreography.getUpdatedAt());
        return dto;
    }

    private ChoreographySummaryDTO toSummaryDTO(Choreography choreography) {
        ChoreographySummaryDTO dto = new ChoreographySummaryDTO();
        dto.setId(choreography.getId());
        dto.setName(choreography.getName());
        dto.setCreatedAt(choreography.getCreatedAt());
        dto.setUpdatedAt(choreography.getUpdatedAt());
        return dto;
    }

    private String routesToJson(Map<String, Object> routes) {
        try {
            return objectMapper.writeValueAsString(routes);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting routes to JSON", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> jsonToRoutes(String json) {
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error parsing routes JSON", e);
        }
    }
}

