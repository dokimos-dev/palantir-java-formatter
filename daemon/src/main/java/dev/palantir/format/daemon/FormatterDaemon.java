package dev.palantir.format.daemon;

import com.google.gson.Gson;
import com.palantir.javaformat.java.FormatterException;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;

public class FormatterDaemon {
    private static final Gson gson = new Gson();
    private static final FormatterService formatterService = new FormatterService();

    public static void main(String[] args) throws Exception {
        BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(System.out));
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
