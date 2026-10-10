import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addUserSkill,
  getSkillGapApplications,
  getSkillGaps,
  getSkills,
  getUserSkills,
  removeUserSkill
} from "@job-tracker/shared";


export default function SkillsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Only one skill gap is expanded at a time. null means all rows are collapsed.
  const [expandedSkillId, setExpandedSkillId] = useState<number | null>(null);


  const {
    data: allSkills = [],
    error: skillsError,
    isLoading: isSkillsLoading
  } = useQuery({
    queryKey: ["skills"],
    queryFn: getSkills
  });


  const {
    data: userSkills = [],
    error: userSkillsError,
    isLoading: isUserSkillsLoading
  } = useQuery({
    queryKey: ["user-skills", 1],
    queryFn: () => getUserSkills(1)
  });


  const {
    data: skillGaps,
    error: skillGapsError,
    isLoading: isSkillGapsLoading
  } = useQuery({
    queryKey: ["skill-gaps", 1],
    queryFn: () => getSkillGaps(1)
  });


  const {
    data: expandedSkill,
    error: expandedSkillError,
    isFetching: isExpandedSkillLoading
  } = useQuery({
    queryKey: ["skill-gap-applications", expandedSkillId],
    queryFn: () => getSkillGapApplications(expandedSkillId!, 1),
    enabled: expandedSkillId !== null
  });


  const addSkillMutation = useMutation({
    mutationFn: (skillId: number) => addUserSkill(skillId, 1),

    onSuccess: async () => {
      setExpandedSkillId(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-skills", 1] }),
        queryClient.invalidateQueries({ queryKey: ["skill-gaps", 1] })
      ]);
    }
  });


  const removeSkillMutation = useMutation({
    mutationFn: (skillId: number) => removeUserSkill(skillId, 1),

    onSuccess: async () => {
      setExpandedSkillId(null);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["user-skills", 1] }),
        queryClient.invalidateQueries({ queryKey: ["skill-gaps", 1] })
      ]);
    }
  });


  // Remove skills already owned by the user from the Add Skills section.
  const userSkillIds = new Set(userSkills.map((skill) => skill.id));
  const availableSkills = allSkills.filter((skill) => !userSkillIds.has(skill.id));

  const isChangingSkill = addSkillMutation.isPending || removeSkillMutation.isPending;


  function handleAddSkill(skillId: number) {
    if (isChangingSkill) return;

    addSkillMutation.mutate(skillId);
  }


  function handleRemoveSkill(skillId: number) {
    if (isChangingSkill) return;

    removeSkillMutation.mutate(skillId);
  }


  function handleSkillGapPress(skillId: number) {
    // Pressing the currently open row collapses it; pressing another row switches the expansion.
    setExpandedSkillId((currentId) => currentId === skillId ? null : skillId);
  }


  function handleApplicationPress(applicationId: number) {
    router.push(`/application/${applicationId}`);
  }


  const isLoading = isSkillsLoading || isUserSkillsLoading || isSkillGapsLoading;
  const loadError = skillsError || userSkillsError || skillGapsError;


  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Skills", headerShown: true }} />

        <SafeAreaView style={styles.center} edges={["bottom"]}>
          <ActivityIndicator size="large" />
          <Text>Loading skills...</Text>
        </SafeAreaView>
      </>
    );
  }


  if (loadError) {
    return (
      <>
        <Stack.Screen options={{ title: "Skills", headerShown: true }} />

        <SafeAreaView style={styles.center} edges={["bottom"]}>
          <Text style={styles.errorText}>
            {loadError instanceof Error ? loadError.message : "Failed to load skills"}
          </Text>
        </SafeAreaView>
      </>
    );
  }


  return (
    <>
      <Stack.Screen options={{ title: "Skills", headerShown: true }} />

      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Skills</Text>
          <Text style={styles.subtitle}>
            Manage your skills and see which skills appear most often across your saved applications.
          </Text>

          {(addSkillMutation.error || removeSkillMutation.error) ? (
            <Text style={styles.errorText}>
              {addSkillMutation.error instanceof Error
                ? addSkillMutation.error.message
                : removeSkillMutation.error instanceof Error
                  ? removeSkillMutation.error.message
                  : "Failed to update skills"}
            </Text>
          ) : null}


          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Skills</Text>
              <Text style={styles.countBadge}>{userSkills.length}</Text>
            </View>

            {userSkills.length > 0 ? (
              <View style={styles.skillContainer}>
                {userSkills.map((skill) => (
                  <Pressable
                    key={skill.id}
                    style={styles.userSkill}
                    disabled={isChangingSkill}
                    onPress={() => handleRemoveSkill(skill.id)}
                  >
                    <Text style={styles.userSkillText}>{skill.name}</Text>
                    <Text style={styles.removeText}>×</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No skills added yet.</Text>
            )}
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Skills</Text>
            <Text style={styles.sectionDescription}>Tap a skill to add it to your profile.</Text>

            {availableSkills.length > 0 ? (
              <View style={styles.skillContainer}>
                {availableSkills.map((skill) => (
                  <Pressable
                    key={skill.id}
                    style={styles.availableSkill}
                    disabled={isChangingSkill}
                    onPress={() => handleAddSkill(skill.id)}
                  >
                    <Text style={styles.availableSkillText}>+ {skill.name}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>You have added all available skills.</Text>
            )}
          </View>


          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skill Gap Summary</Text>
            <Text style={styles.sectionDescription}>
              Skills you are missing, ranked by how many saved applications require them.
            </Text>

            {skillGaps && skillGaps.missingSkills.length > 0 ? (
              <View style={styles.gapList}>
                {skillGaps.missingSkills.map((skill) => {
                  const isExpanded = expandedSkillId === skill.skillId;

                  return (
                    <View key={skill.skillId} style={styles.gapCard}>
                      <Pressable style={styles.gapRow} onPress={() => handleSkillGapPress(skill.skillId)}>
                        <Text style={styles.gapSkillName}>{skill.name}</Text>

                        <View style={styles.gapRight}>
                          <Text style={styles.jobCount}>
                            {skill.jobCount} {skill.jobCount === 1 ? "job" : "jobs"}
                          </Text>

                          <Text style={styles.chevron}>{isExpanded ? "⌄" : "›"}</Text>
                        </View>
                      </Pressable>

                      {isExpanded ? (
                        <View style={styles.expandedContent}>
                          {isExpandedSkillLoading ? (
                            <ActivityIndicator style={styles.expandedLoader} />
                          ) : expandedSkillError ? (
                            <Text style={styles.errorText}>
                              {expandedSkillError instanceof Error
                                ? expandedSkillError.message
                                : "Failed to load applications"}
                            </Text>
                          ) : expandedSkill && expandedSkill.applications.length > 0 ? (
                            expandedSkill.applications.map((application) => (
                              <Pressable
                                key={application.id}
                                style={styles.applicationRow}
                                onPress={() => handleApplicationPress(application.id)}
                              >
                                <View style={styles.applicationInfo}>
                                  <Text style={styles.applicationTitle}>{application.jobTitle}</Text>
                                  <Text style={styles.applicationCompany}>{application.company}</Text>
                                  <Text style={styles.applicationStatus}>{application.status}</Text>
                                </View>

                                <Text style={styles.applicationChevron}>›</Text>
                              </Pressable>
                            ))
                          ) : (
                            <Text style={styles.emptyText}>No applications found for this skill.</Text>
                          )}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.emptyText}>No skill gaps found.</Text>
            )}
          </View>


          {isChangingSkill ? (
            <View style={styles.updatingRow}>
              <ActivityIndicator />
              <Text>Updating skills...</Text>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff"
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 20
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 28
  },

  section: {
    marginBottom: 30
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12
  },

  sectionDescription: {
    fontSize: 14,
    marginTop: -4,
    marginBottom: 14
  },

  countBadge: {
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#eee",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12
  },

  skillContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },

  userSkill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 18,
    paddingLeft: 12,
    paddingRight: 9,
    paddingVertical: 8,
    gap: 7
  },

  userSkillText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600"
  },

  removeText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 18
  },

  availableSkill: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8
  },

  availableSkillText: {
    fontSize: 14,
    fontWeight: "600"
  },

  gapList: {
    gap: 10
  },

  gapCard: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    overflow: "hidden"
  },

  gapRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14
  },

  gapSkillName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600"
  },

  gapRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  jobCount: {
    fontSize: 14,
    fontWeight: "600"
  },

  chevron: {
    width: 18,
    fontSize: 22,
    textAlign: "center"
  },

  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingHorizontal: 14,
    paddingBottom: 6
  },

  expandedLoader: {
    marginVertical: 18
  },

  applicationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },

  applicationInfo: {
    flex: 1
  },

  applicationTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3
  },

  applicationCompany: {
    fontSize: 14,
    marginBottom: 3
  },

  applicationStatus: {
    fontSize: 13
  },

  applicationChevron: {
    fontSize: 24,
    marginLeft: 10
  },

  emptyText: {
    fontSize: 15
  },

  updatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20
  },

  errorText: {
    color: "#b00020",
    fontSize: 15,
    marginBottom: 16
  }
});