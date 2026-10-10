import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteJob,
  getJob,
  getJobMatch,
  updateJobStatus,
  type JobDetail
} from "@job-tracker/shared";


const STATUS_OPTIONS = ["Watched", "Applied", "Interview", "Offer", "Rejected"];


export default function ApplicationDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { id } = useLocalSearchParams<{ id: string }>();
  const numericId = Number(id);
  const isValidId = Boolean(id) && !Number.isNaN(numericId);

  // Rename data as job because this query returns one application detail object.
  const {
    data: job,
    error,
    isLoading
  } = useQuery({
    queryKey: ["application", numericId],
    queryFn: () => getJob(numericId),
    enabled: isValidId
  });

  // Match data is a separate server resource, so keep it in its own query/cache.
  const {
    data: match,
    error: matchError,
    isLoading: isMatchLoading
  } = useQuery({
    queryKey: ["application-match", numericId],
    queryFn: () => getJobMatch(numericId),
    enabled: isValidId
  });


  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => updateJobStatus(numericId, status),

    onSuccess: (_, status) => {
      // Update detail cache immediately so the status changes without another GET.
      queryClient.setQueryData<JobDetail>(
        ["application", numericId],
        (currentJob) => currentJob ? { ...currentJob, status } : currentJob
      );

      // Application list cache may still contain the old status.
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    }
  });


  const deleteMutation = useMutation({
    mutationFn: () => deleteJob(numericId),

    onSuccess: () => {
      // Remove cached resources that belong to the deleted application.
      queryClient.removeQueries({ queryKey: ["application", numericId] });
      queryClient.removeQueries({ queryKey: ["application-match", numericId] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });

      router.replace("/");
    }
  });


  function handleStatusChange(status: string) {
    if (!job || job.status === status || updateStatusMutation.isPending) return;

    updateStatusMutation.mutate(status);
  }


  function handleDeletePress() {
    if (!job || deleteMutation.isPending) return;

    Alert.alert(
      "Delete application",
      `Delete ${job.jobTitle} at ${job.company}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate()
        }
      ]
    );
  }


  if (!isValidId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Invalid application ID.</Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }


  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading application...</Text>
      </View>
    );
  }


  if (error || !job) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Failed to load application"}
        </Text>

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }


  return (
    <>
      <Stack.Screen options={{ title: "Application", headerShown: true }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.jobTitle}>{job.jobTitle}</Text>
        <Text style={styles.company}>{job.company}</Text>

        {updateStatusMutation.error ? (
          <Text style={styles.errorText}>
            {updateStatusMutation.error instanceof Error
              ? updateStatusMutation.error.message
              : "Failed to update status"}
          </Text>
        ) : null}

        {deleteMutation.error ? (
          <Text style={styles.errorText}>
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : "Failed to delete application"}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>

          <View style={styles.statusContainer}>
            {STATUS_OPTIONS.map((status) => {
              const selected = job.status === status;

              return (
                <Pressable
                  key={status}
                  style={[styles.statusButton, selected ? styles.statusButtonSelected : null]}
                  disabled={updateStatusMutation.isPending}
                  onPress={() => handleStatusChange(status)}
                >
                  <Text style={[styles.statusButtonText, selected ? styles.statusButtonTextSelected : null]}>
                    {status}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {updateStatusMutation.isPending ? <ActivityIndicator style={styles.statusLoader} /> : null}
        </View>

        <View style={styles.matchCard}>
          <Text style={styles.matchTitle}>Skill Match</Text>

          {isMatchLoading ? (
            <ActivityIndicator />
          ) : matchError ? (
            <Text style={styles.errorText}>
              {matchError instanceof Error ? matchError.message : "Failed to load skill match"}
            </Text>
          ) : match ? (
            <>
              <Text style={styles.matchScore}>{Math.round(match.matchPercentage)}%</Text>
              <Text style={styles.matchScoreLabel}>Match Score</Text>

              <View style={styles.matchSection}>
                <Text style={styles.matchSectionTitle}>Matched Skills</Text>

                <View style={styles.skillChipContainer}>
                  {match.matchedSkills.length > 0 ? (
                    match.matchedSkills.map((skill) => (
                      <View key={skill} style={[styles.skillChip, styles.matchedSkillChip]}>
                        <Text style={styles.matchedSkillText}>{skill}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.value}>No matched skills.</Text>
                  )}
                </View>
              </View>

              <View style={styles.matchSection}>
                <Text style={styles.matchSectionTitle}>Missing Skills</Text>

                <View style={styles.skillChipContainer}>
                  {match.missingSkills.length > 0 ? (
                    match.missingSkills.map((skill) => (
                      <View key={skill} style={[styles.skillChip, styles.missingSkillChip]}>
                        <Text style={styles.missingSkillText}>{skill}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.value}>No missing skills.</Text>
                  )}
                </View>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Job URL</Text>
          <Text style={styles.value}>{job.jobUrl || "Not provided"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Skills</Text>

          {job.skills.length > 0 ? (
            job.skills.map((skill) => (
              <Text key={skill.id} style={styles.skill}>• {skill.name}</Text>
            ))
          ) : (
            <Text style={styles.value}>No skills listed.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <Text style={styles.description}>{job.rawJobDescription}</Text>
        </View>

        <Pressable style={styles.deleteButton} disabled={deleteMutation.isPending} onPress={handleDeletePress}>
          {deleteMutation.isPending ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Application</Text>
          )}
        </Pressable>
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

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20
  },

  jobTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6
  },

  company: {
    fontSize: 18,
    marginBottom: 24
  },

  section: {
    marginBottom: 22
  },

  label: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8
  },

  value: {
    fontSize: 16
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

  statusLoader: {
    alignSelf: "flex-start",
    marginTop: 12
  },

  matchCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    padding: 16,
    marginBottom: 22
  },

  matchTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },

  matchScore: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center"
  },

  matchScoreLabel: {
    textAlign: "center",
    marginBottom: 20
  },

  matchSection: {
    marginTop: 4,
    marginBottom: 16
  },

  matchSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8
  },

  skillChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },

  skillChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6
  },

  matchedSkillChip: {
    backgroundColor: "#e8f5e9"
  },

  missingSkillChip: {
    backgroundColor: "#ffebee"
  },

  matchedSkillText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600"
  },

  missingSkillText: {
    color: "#c62828",
    fontSize: 14,
    fontWeight: "600"
  },

  skill: {
    fontSize: 16,
    marginBottom: 4
  },

  description: {
    fontSize: 16,
    lineHeight: 24
  },

  errorText: {
    fontSize: 15,
    marginBottom: 16,
    textAlign: "center",
    color: "#b00020"
  },

  backButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10
  },

  backButtonText: {
    color: "#fff",
    fontWeight: "600"
  },

  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#b00020",
    borderRadius: 10,
    paddingVertical: 12
  },

  deleteButtonText: {
    color: "#b00020",
    fontWeight: "700"
  }
});