package dev.palantir.format.daemon;

import com.palantir.javaformat.java.Formatter;
import com.palantir.javaformat.java.FormatterException;
import com.palantir.javaformat.java.JavaFormatterOptions;

public class FormatterService {
    private Formatter formatter;

    public FormatterService() {
        JavaFormatterOptions options = JavaFormatterOptions.builder()
                .style(JavaFormatterOptions.Style.PALANTIR)
                .build();
        // Using reflection to instantiate the formatter since constructor is not public
        try {
            java.lang.reflect.Constructor<Formatter> constructor = Formatter.class
                    .getDeclaredConstructor(JavaFormatterOptions.class, boolean.class);
            constructor.setAccessible(true);
            this.formatter = constructor.newInstance(options, false);
        } catch (Exception e) {
            throw new RuntimeException("Failed to instantiate Formatter", e);
        }
    }

    public String format(String source, String style) throws FormatterException {
        return formatter.formatSource(source);
    }

    public String formatRange(
            String source,
            String style,
            int startLine,
            int startColumn,
            int endLine,
            int endColumn)
            throws FormatterException {
        // For now, format the entire document
        // In a full implementation, this would use the range-based formatting API
        return format(source, style);
    }
}
