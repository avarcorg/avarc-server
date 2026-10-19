package org.avarc.server;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.ServerSocket;

/** Free ports for tests that start the real server, with the actuator on a port of its own. */
public final class TestPorts {

    private TestPorts() {}

    public static int free() {
        try (ServerSocket socket = new ServerSocket(0)) {
            return socket.getLocalPort();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
