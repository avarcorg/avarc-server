package org.avarc.server.backend.modules.dashboard.api;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardRequest {
    private String username;
    private String password;
}
