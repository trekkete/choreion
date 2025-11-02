package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.dto.CreateProjectRequest;
import it.trekkete.choreion.data.dto.ProjectDTO;
import it.trekkete.choreion.data.entity.Project;
import it.trekkete.choreion.data.entity.Role;
import it.trekkete.choreion.data.entity.User;
import it.trekkete.choreion.data.entity.UserPersonMapping;
import it.trekkete.choreion.data.repository.ProjectRepository;
import it.trekkete.choreion.data.repository.UserPersonMappingRepository;
import it.trekkete.choreion.data.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserPersonMappingRepository mappingRepository;

    public List<ProjectDTO> getUserProjects(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is ROLE_USER (and only ROLE_USER)
        boolean isOnlyUser = user.getRoles().stream()
                .allMatch(role -> role.getName() == Role.RoleType.ROLE_USER);

        if (isOnlyUser) {
            // For ROLE_USER, return only projects where they have person mappings
            List<UserPersonMapping> mappings = mappingRepository.findByUserId(user.getId());
            Set<Long> projectIds = new HashSet<>();
            for (UserPersonMapping mapping : mappings) {
                if (mapping.getPerson() != null && mapping.getPerson().getProject() != null) {
                    projectIds.add(mapping.getPerson().getProject().getId());
                }
            }

            return projectRepository.findAllById(projectIds)
                    .stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        } else {
            // For CHOREOGRAPHER and ADMIN, return projects they own
            return projectRepository.findByOwnerOrderByUpdatedAtDesc(user)
                    .stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }
    }

    public ProjectDTO getProjectById(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Verify user owns the project
        if (!project.getOwner().getUsername().equals(username)) {
            throw new AccessDeniedException("You don't have access to this project");
        }

        return toDTO(project);
    }

    @Transactional
    public ProjectDTO createProject(CreateProjectRequest request, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setOwner(user);

        Project saved = projectRepository.save(project);
        return toDTO(saved);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, CreateProjectRequest request, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Verify user owns the project
        if (!project.getOwner().getUsername().equals(username)) {
            throw new AccessDeniedException("You don't have access to this project");
        }

        project.setName(request.getName());
        project.setDescription(request.getDescription());

        Project updated = projectRepository.save(project);
        return toDTO(updated);
    }

    @Transactional
    public void deleteProject(Long id, String username) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        // Verify user owns the project
        if (!project.getOwner().getUsername().equals(username)) {
            throw new AccessDeniedException("You don't have access to this project");
        }

        projectRepository.delete(project);
    }

    private ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setOwnerId(project.getOwner().getId());
        dto.setOwnerUsername(project.getOwner().getUsername());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        return dto;
    }
}
