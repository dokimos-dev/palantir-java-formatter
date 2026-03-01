package dev.palantir.format.daemon;

import com.google.gson.Gson;
import com.palantir.javaformat.java.FormatterException;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintStream;

public class FormatterDaemon {
    private static final Gson gson = new Gson();
    private static final FormatterService formatterService = new FormatterService();

    public static void main(String[] args) throws Exception {
        // Use raw fd for protocol output so nothing else can interfere
        FileOutputStream rawStdout = new FileOutputStream(FileDescriptor.out);
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(rawStdout));

        // Redirect System.out to stderr so library debug output
        // doesn't corrupt the JSON protocol
        PrintStream stderrStream = new PrintStream(new FileOutputStream(FileDescriptor.err), true);
        System.setOut(stderrStream);

        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));

        System.err.println("Daemon ready");

        String line;
        while ((line = reader.readLine()) != null) {
            try {
                Protocol.Request request = gson.fromJson(line, Protocol.Request.class);
                Protocol.Response response = new Protocol.Response();
                response.id = request.id;

                if ("format".equals(request.method)) {
                    Protocol.FormatRequest formatRequest =
                            gson.fromJson(request.params, Protocol.FormatRequest.class);
                    try {
                        String formatted =
                                formatterService.format(
                                        formatRequest.source,
                                        formatRequest.style != null ? formatRequest.style : "PALANTIR");
                        response.result = gson.toJsonTree(new Protocol.FormatResult(formatted));
                    } catch (FormatterException e) {
                        response.error = new Protocol.ErrorDetail("FORMATTER_ERROR", e.getMessage());
                    }
                } else {
                    response.error = new Protocol.ErrorDetail("UNKNOWN_METHOD", "Unknown method: " + request.method);
                }

                String responseJson = gson.toJson(response);
                writer.write(responseJson);
                writer.newLine();
                writer.flush();
            } catch (Exception e) {
                System.err.println("Error processing request: " + e.getMessage());
                e.printStackTrace(System.err);
            }
        }
    }
}
