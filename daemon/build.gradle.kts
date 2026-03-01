plugins {
    java
}

group = "dev.palantir.format"
version = "0.1.0"

repositories {
    mavenCentral()
}

dependencies {
    implementation("com.palantir.javaformat:palantir-java-format:2.86.0")
    implementation("com.google.code.gson:gson:2.10.1")
    implementation("com.google.guava:guava:33.0.0-jre")
}

java {
    sourceCompatibility = JavaVersion.VERSION_11
    targetCompatibility = JavaVersion.VERSION_11
}

// Create an uber jar with all dependencies embedded
tasks.register<Jar>("fatJar") {
    group = "build"
    description = "Create a fat JAR with all dependencies"

    duplicatesStrategy = DuplicatesStrategy.EXCLUDE
    manifest {
        attributes["Main-Class"] = "dev.palantir.format.daemon.FormatterDaemon"
    }

    from(sourceSets.main.get().output)
    dependsOn(configurations.runtimeClasspath)
    from({
        configurations.runtimeClasspath.get()
                .filter { it.isFile }
                .map { zipTree(it) }
    })

    archiveFileName.set("formatter-daemon.jar")

    exclude("META-INF/*.SF")
    exclude("META-INF/*.DSA")
    exclude("META-INF/*.RSA")
    exclude("META-INF/maven/**")
    exclude("META-INF/versions/**")
}

// Make the build task run fatJar by default
tasks.build {
    dependsOn("fatJar")
}
