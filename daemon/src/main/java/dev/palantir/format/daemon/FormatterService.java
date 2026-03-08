package dev.palantir.format.daemon;

import com.google.common.collect.Range;
import com.palantir.javaformat.java.Formatter;
import com.palantir.javaformat.java.FormatterException;
import com.palantir.javaformat.java.JavaFormatterOptions;
import java.util.Collections;

public class FormatterService {
    private final Formatter formatter;

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
        int startOffset = lineColumnToOffset(source, startLine, startColumn);
        int endOffset = lineColumnToOffset(source, endLine, endColumn);

        if (startOffset >= endOffset) {
            return source;
        }

        return formatter.formatSource(
                source, Collections.singleton(Range.closedOpen(startOffset, endOffset)));
    }

    private static int lineColumnToOffset(String source, int line, int column) {
        int offset = 0;
        for (int i = 0; i < line; i++) {
            int newline = source.indexOf('\n', offset);
            if (newline == -1) {
                return source.length();
            }
            offset = newline + 1;
        }
        return Math.min(offset + column, source.length());
    }
}
