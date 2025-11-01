package it.trekkete.choreion.data.service;

import it.trekkete.choreion.data.entity.User;
import it.trekkete.choreion.data.repository.UserRepository;
import it.trekkete.choreion.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                                  .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return UserPrincipal.create(user);
    }

    @Transactional
    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                                  .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));

        return UserPrincipal.create(user);
    }
}