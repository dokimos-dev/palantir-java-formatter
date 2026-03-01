package dev.palantir.format.daemon;

import com.google.gson.JsonElement;

public class Protocol {
    public static class Request {
        public String id;
        public String method;
        public JsonElement params;
    }

    public static class Response {
        public String id;
        public JsonElement result;
        public ErrorDetail error;
    }

    public static class ErrorDetail {
        public String code;
        public String message;

        public ErrorDetail(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }

    public static class FormatRequest {
        public String source;
        public String style;
        public Integer startLine;
        public Integer startColumn;
        public Integer endLine;
        public Integer endColumn;
    }

    public static class FormatResult {
        public String formatted;

        public FormatResult(String formatted) {
            this.formatted = formatted;
        }
    }
}
