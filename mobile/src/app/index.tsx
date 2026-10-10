import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";

import { getJobs } from "@job-tracker/shared";


const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  "All",
  "Watched",
  "Applied",
  "Interview",
  "Offer",
  "Rejected"
] as const;

type StatusFilter = typeof STATUS_OPTIONS[number];


export default function ApplicationsScreen() {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [appliedKeyword, setAppliedKeyword] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("All");

  const {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["applications", appliedKeyword, selectedStatus],
    initialPageParam: 1,

    // Keyword and status are part of the query key, so changing either loads a separate result.
    queryFn: ({ pageParam }) => getJobs(appliedKeyword, selectedStatus, pageParam, PAGE_SIZE),

    getNextPageParam: (lastPage) => {
      // Returning undefined tells TanStack Query that pagination has reached the last page.
      if (lastPage.page >= lastPage.totalPages) return undefined;

      return lastPage.page + 1;
    }
  });

  // Infinite queries store results page by page, while FlatList needs one flat array.
  const jobs = data?.pages.flatMap((page) => page.items) ?? [];

  // Status counts are identical across pages in the same search, so the first page is enough.
  const statusCounts = data?.pages[0]?.statusCounts;


  function handleSearch() {
    const nextKeyword = keyword.trim();

    // The query key does not change when searching the same keyword, so refetch manually.
    if (nextKeyword === appliedKeyword) {
      refetch();
      return;
    }

    setAppliedKeyword(nextKeyword);
  }


  function handleStatusPress(status: StatusFilter) {
    setSelectedStatus(status);
  }


  function handleLoadMore() {
    // FlatList can call onEndReached multiple times, so prevent duplicate requests.
    if (!hasNextPage || isFetchingNextPage) return;

    fetchNextPage();
  }


  function handleOpenApplication(id: number) {
    router.push(`/application/${id}`);
  }


  function handleOpenSkills() {
    router.push("/explore");
  }


  function handleAddApplication() {
    router.push("/application/new");
  }


  function getStatusCount(status: StatusFilter) {
    if (!statusCounts) return 0;

    if (status === "All") return statusCounts.all;
    if (status === "Watched") return statusCounts.watched;
    if (status === "Applied") return statusCounts.applied;
    if (status === "Interview") return statusCounts.interview;
    if (status === "Offer") return statusCounts.offer;

    return statusCounts.rejected;
  }


  if (isLoading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading applications...</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Applications</Text>

        <View style={styles.headerActions}>
          <Pressable style={styles.skillsButton} hitSlop={8} onPress={handleOpenSkills}>
            <Text style={styles.skillsButtonText}>Skills</Text>
          </Pressable>

          <Pressable style={styles.addButton} hitSlop={8} onPress={handleAddApplication}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        style={styles.statusScroll}
        contentContainerStyle={styles.statusContainer}
        showsHorizontalScrollIndicator={false}
      >
        {STATUS_OPTIONS.map((status) => {
          const isSelected = selectedStatus === status;

          return (
            <Pressable
              key={status}
              style={[styles.statusButton, isSelected && styles.statusButtonSelected]}
              onPress={() => handleStatusPress(status)}
            >
              <Text style={[styles.statusButtonText, isSelected && styles.statusButtonTextSelected]}>
                {status} {getStatusCount(status)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
          placeholder="Search applications"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <Pressable style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.errorText}>
          {error instanceof Error ? error.message : "Failed to load applications"}
        </Text>
      ) : null}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => handleOpenApplication(item.id)}>
            <Text style={styles.jobTitle}>{item.jobTitle}</Text>
            <Text style={styles.company}>{item.company}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <Text style={styles.detailsText}>View details</Text>
          </Pressable>
        )}
        refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={refetch} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator style={styles.footerLoader} /> : null}
        ListEmptyComponent={<Text style={styles.emptyText}>No applications found.</Text>}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
    marginBottom: 16
  },

  title: {
    fontSize: 28,
    fontWeight: "700"
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },

  skillsButton: {
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },

  skillsButtonText: {
    fontWeight: "700"
  },

  addButton: {
    backgroundColor: "#222",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "700"
  },

  statusScroll: {
    flexGrow: 0,
    height: 48,
    marginBottom: 14
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8
  },

  statusButton: {
    height: 38,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 19,
    paddingHorizontal: 14
  },

  statusButtonSelected: {
    backgroundColor: "#222",
    borderColor: "#222"
  },

  statusButtonText: {
    fontSize: 14,
    fontWeight: "600"
  },

  statusButtonTextSelected: {
    color: "#fff"
  },

  searchRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16
  },

  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },

  searchButton: {
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#222"
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "600"
  },

  errorText: {
    marginBottom: 12,
    color: "#b00020"
  },

  card: {
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12
  },

  jobTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4
  },

  company: {
    marginBottom: 4
  },

  status: {
    marginBottom: 8
  },

  detailsText: {
    fontSize: 14,
    fontWeight: "600"
  },

  footerLoader: {
    marginVertical: 20
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40
  }
});