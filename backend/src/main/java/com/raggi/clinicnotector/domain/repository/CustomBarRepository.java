package com.raggi.clinicnotector.domain.repository;

import com.raggi.clinicnotector.domain.model.CustomBar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomBarRepository extends JpaRepository<CustomBar, Long> {
    List<CustomBar> findAllByOrderByCreatedAtDesc();
}
