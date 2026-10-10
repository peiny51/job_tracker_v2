import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { analyzeJobPost, createJob, type CreateJobRequest } from "@job-tracker/shared";


const STATUS_OPTIONS = ["Watched", "Applied", "Interview", "Rejected", "Offer"];


export default function NewApplicationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [status, setStatus] = useState("Watched");
  const [rawSkillTags, setRawSkillTags] = useState("");
  const [rawJobDescription, setRawJobDescription] = useState("");
  const [detectedSkills, setDetectedSkills] = useState<string[]>([]);
  const [error, setError] = useState("");


  const analyzeMutation = useMutation({
    mutationFn: () => analyzeJobPost(rawJobDescription),

    onSuccess: (result) => {
      setCompany(result.company ?? "");
      setJobTitle(result.jobTitle ?? "");
      setJobUrl(result.jobUrl ?? "");
      setDetectedSkills(result.skills);
      setRawSkillTags(result.skills.join("\n"));
    },

    onError: () => {
      setError("Failed to analyze job post.");
    }
  });


  const createMutation = useMutation({
    mutationFn: (job: CreateJobRequest) => createJob(job),

    onSuccess: async () => {
      // Creating a job changes the applications list, so refresh cached lists.
      await queryClient.invalidateQueries({ queryKey: ["applications"] });
      router.replace("/");
    },

    onError: () => {
      setError("Failed to create application.");
    }
  });


  function handleAnalyze() {
    if (!rawJobDescription.trim()) {
      setError("Please paste a job description first.");
      return;
    }

    setError("");
    analyzeMutation.mutate();
  }


  function handleCreate() {
    if (!company.trim() || !jobTitle.trim()) {
      setError("Company and job title are required.");
      return;
    }

    setError("");

    const job: CreateJobRequest = {
      userId: 1,
      company: company.trim(),
      jobTitle: jobTitle.trim(),
      jobUrl: jobUrl.trim() ? jobUrl.trim() : null,
      rawSkillTags,
      rawJobDescription,
      status
    };

    createMutation.mutate(job);
  }


  return (
    <>
      <Stack.Screen options={{ title: "Add Application", headerShown: true }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Company</Text>
          <TextInput style={styles.input} value={company} onChangeText={setCompany} placeholder="Company name" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Job Title</Text>
          <TextInput style={styles.input} value={jobTitle} onChangeText={setJobTitle} placeholder="Job title" />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Job URL</Text>
          <TextInput
            style={styles.input}
            value={jobUrl}
            onChangeText={setJobUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>

          <View style={styles.statusContainer}>
            {STATUS_OPTIONS.map((option) => {
              const selected = status === option;

              return (
                <Pressable
                  key={option}
                  style={[styles.statusButton, selected ? styles.statusButtonSelected : null]}
                  onPress={() => setStatus(option)}
                >
                  <Text style={[styles.statusButtonText, selected ? styles.statusButtonTextSelected : null]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Skills / Qualifications</Text>

          <TextInput
            style={[styles.input, styles.skillsInput]}
            value={rawSkillTags}
            onChangeText={setRawSkillTags}
            placeholder="Paste skills or qualifications..."
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.helperText}>
            Put one skill per line. The backend will extract and normalize them when the application is created.
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Full Job Post</Text>

          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={rawJobDescription}
            onChangeText={setRawJobDescription}
            placeholder="Paste the full job posting here..."
            multiline
            textAlignVertical="top"
          />

          <Pressable
            style={[styles.analyzeButton, analyzeMutation.isPending ? styles.disabledButton : null]}
            disabled={analyzeMutation.isPending}
            onPress={handleAnalyze}
          >
            {analyzeMutation.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
            )}
          </Pressable>
        </View>

        {detectedSkills.length > 0 ? (
          <View style={styles.detectedSection}>
            <Text style={styles.label}>Detected Skills</Text>

            <View style={styles.detectedSkills}>
              {detectedSkills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.actions}>
          <Pressable style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.createButton, createMutation.isPending ? styles.disabledButton : null]}
            disabled={createMutation.isPending}
            onPress={handleCreate}
          >
            {createMutation.isPending ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.createButtonText}>Create Application</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },

  content: {
    padding: 20,
    paddingBottom: 40
  },

  field: {
    marginBottom: 20
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16
  },

  skillsInput: {
    minHeight: 110
  },

  descriptionInput: {
    minHeight: 220
  },

  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    lineHeight: 18
  },

  statusContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },

  statusButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7
  },

  statusButtonSelected: {
    backgroundColor: "#222",
    borderColor: "#222"
  },

  statusButtonText: {
    fontSize: 14
  },

  statusButtonTextSelected: {
    color: "#fff",
    fontWeight: "600"
  },

  analyzeButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    backgroundColor: "#6d28d9",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11
  },

  analyzeButtonText: {
    color: "#fff",
    fontWeight: "700"
  },

  detectedSection: {
    marginBottom: 20
  },

  detectedSkills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },

  skillChip: {
    backgroundColor: "#f3e8ff",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7
  },

  skillChipText: {
    color: "#6d28d9",
    fontSize: 14
  },

  errorText: {
    marginBottom: 16,
    color: "#b00020"
  },

  actions: {
    flexDirection: "row",
    gap: 10
  },

  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 13
  },

  cancelButtonText: {
    fontWeight: "600"
  },

  createButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    borderRadius: 10,
    paddingVertical: 13
  },

  createButtonText: {
    color: "#fff",
    fontWeight: "700"
  },

  disabledButton: {
    opacity: 0.6
  }
});