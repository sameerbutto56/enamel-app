import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/api/AuthContext";
import { COLORS } from "../../src/theme";
import { api, extractError } from "../../src/api/client";

export default function Profile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [employeeName, setEmployeeName] = React.useState("");
  const [employeeEmail, setEmployeeEmail] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [employeePassword, setEmployeePassword] = React.useState("");
  const [savingEmployee, setSavingEmployee] = React.useState(false);
  const [employees, setEmployees] = React.useState<
    { id: string; name: string; email: string; department_id?: string }[]
  >([]);

  const confirmLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  const saveEmployee = async () => {
    if (!employeeName || !employeeEmail || !departmentId || !employeePassword) {
      Alert.alert("Missing details", "Please fill all employee fields.");
      return;
    }
    setSavingEmployee(true);
    try {
      await api.post("/auth/employees", {
        name: employeeName.trim(),
        email: employeeEmail.trim().toLowerCase(),
        department_id: departmentId.trim().toLowerCase(),
        password: employeePassword,
      });
      setEmployeeName("");
      setEmployeeEmail("");
      setDepartmentId("");
      setEmployeePassword("");
      await loadEmployees();
      Alert.alert("Saved", "Employee assigned successfully.");
    } catch (e: any) {
      Alert.alert("Unable to save employee", extractError(e));
    } finally {
      setSavingEmployee(false);
    }
  };

  const loadEmployees = React.useCallback(async () => {
    if (user?.role !== "admin") return;
    try {
      const { data } = await api.get("/auth/employees/list");
      setEmployees(Array.isArray(data) ? data : []);
    } catch {
      setEmployees([]);
    }
  }, [user?.role]);

  React.useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={{ padding: 20 }}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1742281694796-36a9ae24b59a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBmYWN0b3J5JTIwd29ya2VyJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc2ODY3MjkxfDA&ixlib=rb-4.1.0&q=85",
            }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user?.name || "Admin"}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleText}>
              {(user?.role || "admin").toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow label="ORG" value="Enamels Mfg." />
          <InfoRow label="DEPARTMENT" value={user?.department_id || "ADMIN"} />
          <InfoRow
            label="ACCESS"
            value={
              user?.role === "admin"
                ? "Full · Stage Control"
                : "Assigned Department Steps"
            }
            last
          />
        </View>

        {user?.role === "admin" && (
          <View style={styles.adminCard}>
            <Text style={styles.adminTitle}>ASSIGN DEPARTMENT</Text>
            <TextInput
              style={styles.input}
              placeholder="Employee name"
              placeholderTextColor={COLORS.textTertiary}
              value={employeeName}
              onChangeText={setEmployeeName}
            />
            <TextInput
              style={styles.input}
              placeholder="Employee email"
              placeholderTextColor={COLORS.textTertiary}
              value={employeeEmail}
              onChangeText={setEmployeeEmail}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Department ID (e.g. stitching)"
              placeholderTextColor={COLORS.textTertiary}
              value={departmentId}
              onChangeText={setDepartmentId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Temporary password"
              placeholderTextColor={COLORS.textTertiary}
              value={employeePassword}
              onChangeText={setEmployeePassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={[styles.assignBtn, savingEmployee && { opacity: 0.6 }]}
              onPress={saveEmployee}
              disabled={savingEmployee}
            >
              {savingEmployee ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.assignText}>SAVE EMPLOYEE</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.adminTitle}>EMPLOYEES & DEPARTMENTS</Text>
            {employees.length === 0 ? (
              <Text style={styles.emptyEmp}>No employees assigned yet.</Text>
            ) : (
              employees.map((emp) => (
                <View key={emp.id} style={styles.empRow}>
                  <Text style={styles.empName}>{emp.name}</Text>
                  <Text style={styles.empMeta}>{emp.email}</Text>
                  <Text style={styles.empMeta}>
                    DEPT ID: {(emp.department_id || "N/A").toUpperCase()}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          testID="logout-button"
          style={styles.logoutBtn}
          onPress={confirmLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>ENAMELS v1.0 · Internal build</Text>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        !last && { borderBottomWidth: 1, borderBottomColor: COLORS.border },
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  kicker: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -1,
    marginBottom: 20,
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: COLORS.border,
  },
  name: { fontSize: 20, fontWeight: "900", color: COLORS.text },
  email: { color: COLORS.textSecondary, marginTop: 4, fontSize: 13 },
  roleChip: {
    marginTop: 12,
    backgroundColor: COLORS.text,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 14,
  },
  adminCard: {
    marginTop: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  adminTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: COLORS.accent,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 10,
    color: COLORS.text,
  },
  assignBtn: {
    marginTop: 2,
    height: 46,
    backgroundColor: COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  assignText: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 1.5,
    fontSize: 12,
  },
  emptyEmp: { color: COLORS.textSecondary, fontSize: 12 },
  empRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
    padding: 10,
  },
  empName: { fontWeight: "800", color: COLORS.text, fontSize: 13 },
  empMeta: { marginTop: 3, color: COLORS.textSecondary, fontSize: 11 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "800",
    letterSpacing: 1,
  },
  infoValue: { fontSize: 13, color: COLORS.text, fontWeight: "700" },
  logoutBtn: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    color: "#DC2626",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 13,
  },
  version: {
    textAlign: "center",
    color: COLORS.textTertiary,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "700",
    marginTop: 22,
  },
});
