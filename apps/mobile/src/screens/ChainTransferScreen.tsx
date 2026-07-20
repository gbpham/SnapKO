/**
 * Transfer that is only completed after the receiving area accepts it.
 */
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getDB } from "../db";
import { BufferedTextInput } from "../components/BufferedTextInput";
import { useInventoryModel } from "../contexts/InventoryModelContext";
import {
  buildTransferRouteLabel,
  canSubmitChainTransfer,
  selectDefaultDestination,
  type ChainTransferArea,
} from "../features/transfers/chainTransferState";
import { api } from "../services/api";
import { parseNumericField } from "./inventoryCaptureValidation";

type PickerTarget = "source" | "destination" | null;
type Area = ChainTransferArea & { isActive?: boolean; isDefault?: boolean };
type Ingredient = { id: string; name: string; base_unit: string; available_qty?: number };

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

const toArea = (area: any): Area => ({
  id: area.id,
  name: area.name,
  type: area.type === "SERVICE" ? "SERVICE" : "STORAGE",
  branchName: area.branch?.name ?? area.branchName ?? area.branch_name ?? null,
  isActive: area.isActive ?? area.is_active ?? true,
  isDefault: area.isDefault ?? area.is_default ?? false,
});

export default function ChainTransferScreen({ onBack, onSuccess }: Props) {
  const insets = useSafeAreaInsets();
  const { model } = useInventoryModel();
  const [areas, setAreas] = useState<Area[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Map<string, number>>(new Map());
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const source = areas.find((area) => area.id === sourceId) ?? null;
  const destination = areas.find((area) => area.id === destinationId) ?? null;
  const pickerAreas = useMemo(
    () => (picker === "destination" ? areas.filter((area) => area.id !== sourceId) : areas),
    [areas, picker, sourceId],
  );
  const canSubmit = canSubmitChainTransfer(sourceId, destinationId, selected.size);
  const visibleIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(search.toLowerCase()),
  );

  const loadIngredients = async (areaId: string) => {
    const db = await getDB();
    const rows = await db.getAllAsync<Ingredient>(
      `SELECT i.id, i.name, i.base_unit, COALESCE(sl.quantity, 0) AS available_qty
       FROM local_ingredients i
       LEFT JOIN local_stock_levels sl
         ON sl.ingredient_id = i.id AND sl.area_id = ? AND sl.deleted_at IS NULL
       WHERE COALESCE(i.archived, 0) = 0
       ORDER BY i.name ASC`,
      [areaId],
    );
    setIngredients(rows);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const db = await getDB();
        const local = await db.getAllAsync<any>(
          `SELECT id, name, type, is_default, is_active
           FROM local_storage_areas
           WHERE is_active = 1
           ORDER BY is_default DESC, name ASC`,
        );
        let nextAreas = local.map(toArea);

        try {
          const remote = await api.get<any[]>("/storage-areas");
          if (Array.isArray(remote) && remote.length) {
            nextAreas = remote.map(toArea).filter((area) => area.isActive !== false);
          }
        } catch {
          // The local cache keeps the selection UI usable while offline.
        }

        const defaultSource =
          nextAreas.find((area) => area.type === "STORAGE") ?? nextAreas[0] ?? null;
        setAreas(nextAreas);
        setSourceId(defaultSource?.id ?? null);
        setDestinationId(selectDefaultDestination(nextAreas, defaultSource?.id ?? null)?.id ?? null);
        if (defaultSource) await loadIngredients(defaultSource.id);
      } catch (error) {
        console.error("Load Chain transfer data failed:", error);
        Alert.alert("Lỗi", "Không tải được khu vực và nguyên liệu để chuyển.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chooseArea = async (area: Area) => {
    if (picker === "source") {
      setSourceId(area.id);
      setDestinationId((current) =>
        current === area.id ? selectDefaultDestination(areas, area.id)?.id ?? null : current,
      );
      setSelected(new Map());
      await loadIngredients(area.id);
    } else if (picker === "destination") {
      setDestinationId(area.id);
    }
    setPicker(null);
  };

  const updateQuantity = (id: string, value: string) => {
    const quantity = parseNumericField(value);
    setSelected((current) => {
      const next = new Map(current);
      if (quantity > 0) next.set(id, quantity);
      else next.delete(id);
      return next;
    });
  };

  const createTransfer = async () => {
    if (!source || !destination || !canSubmit) {
      Alert.alert("Thiếu thông tin", "Chọn nguồn, nơi nhận và ít nhất một nguyên liệu.");
      return;
    }
    const items = [...selected.entries()].map(([ingredientId, quantity]) => {
      const ingredient = ingredients.find((item) => item.id === ingredientId);
      return { ingredientId, name: ingredient?.name, quantity, unit: ingredient?.base_unit };
    });

    setSaving(true);
    try {
      await api.post("/inventory/transfer", {
        fromAreaId: source.id,
        toAreaId: destination.id,
        items,
        notes: model === "CHAIN" ? "Điều phối kho/quán từ Mobile" : "Cấp hàng từ Mobile",
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Đã tạo phiếu chờ nhận",
        `${buildTransferRouteLabel(destination)} phải bấm “Nhận hàng” trước khi tồn kho được cộng.`,
        [{ text: "OK", onPress: onSuccess }],
      );
    } catch (error) {
      console.error("Create transfer failed:", error);
      Alert.alert(
        "Không thể tạo phiếu",
        error instanceof Error ? error.message : "Kiểm tra mạng và tồn kho nguồn rồi thử lại.",
      );
    } finally {
      setSaving(false);
    }
  };

  const selector = (label: string, area: Area | null, target: Exclude<PickerTarget, null>) => (
    <TouchableOpacity style={styles.selector} onPress={() => setPicker(target)}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <View style={styles.selectorValue}>
        <Ionicons name={target === "source" ? "archive-outline" : "storefront-outline"} size={17} color="#E07A2F" />
        <Text style={styles.selectorText} numberOfLines={1}>
          {area ? buildTransferRouteLabel(area) : "Chọn khu vực"}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#94A3B8" />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={23} color="#E07A2F" />
          <Text style={styles.backText}>Quay lại</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>{model === "CHAIN" ? "Chuyển kho / quán" : "Cấp hàng"}</Text>
          <Text style={styles.subtitle}>Kho đích chỉ cộng sau khi Nhận hàng</Text>
        </View>
      </View>

      <View style={styles.routeCard}>
        {selector("Từ kho/quán", source, "source")}
        <Ionicons name="arrow-down" size={20} color="#E07A2F" style={styles.arrowDown} />
        {selector("Đến kho/quán", destination, "destination")}
      </View>
      <View style={styles.search}>
        <Ionicons name="search" size={20} color="#64748B" />
        <TextInput style={styles.searchInput} placeholder="Tìm nguyên liệu tại nguồn..." placeholderTextColor="#64748B" value={search} onChangeText={setSearch} />
      </View>

      {loading ? <ActivityIndicator color="#E07A2F" style={{ flex: 1 }} /> : (
        <FlatList
          data={visibleIngredients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const quantity = selected.get(item.id);
            return (
              <View style={[styles.item, quantity !== undefined ? styles.itemSelected : undefined]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>Tồn nguồn: {Number(item.available_qty ?? 0).toLocaleString("vi-VN")} {item.base_unit}</Text>
                </View>
                <BufferedTextInput style={styles.quantity} placeholder="0" placeholderTextColor="#64748B" keyboardType="decimal-pad" value={quantity?.toString() ?? ""} onCommitText={(value) => updateQuantity(item.id, value)} />
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>{source ? "Chưa có nguyên liệu ở khu vực nguồn. Hãy đồng bộ lại." : "Cần có ít nhất hai khu vực để chuyển hàng."}</Text>}
        />
      )}

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <Text style={styles.footerText}>Đã chọn: <Text style={styles.count}>{selected.size}</Text> nguyên liệu</Text>
        <TouchableOpacity disabled={!canSubmit || saving} onPress={createTransfer} style={[styles.submit, (!canSubmit || saving) && styles.submitDisabled]}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitText}>TẠO PHIẾU CHỜ NHẬN</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{picker === "source" ? "Chọn kho/quán nguồn" : "Chọn kho/quán nhận"}</Text>
              <TouchableOpacity onPress={() => setPicker(null)}><Ionicons name="close" size={24} color="#F5F3EF" /></TouchableOpacity>
            </View>
            <FlatList
              data={pickerAreas}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.pickerRow} onPress={() => chooseArea(item)}>
                  <Ionicons name={item.type === "SERVICE" ? "wine-outline" : "archive-outline"} size={20} color="#E07A2F" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{buildTransferRouteLabel(item)}</Text>
                    <Text style={styles.itemMeta}>{item.type === "SERVICE" ? "Quầy phục vụ" : "Kho lưu trữ"}</Text>
                  </View>
                  {(picker === "source" ? sourceId : destinationId) === item.id ? <Ionicons name="checkmark-circle" size={20} color="#6B8E23" /> : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderBottomWidth: 1, borderBottomColor: "#2A2A2A" },
  back: { flexDirection: "row", alignItems: "center", padding: 8, marginLeft: -8 }, backText: { color: "#E07A2F", fontWeight: "600", marginLeft: 4 },
  headerText: { flex: 1, alignItems: "center", marginRight: 56 }, title: { color: "#F5F3EF", fontSize: 16, fontWeight: "700" }, subtitle: { color: "#94A3B8", fontSize: 10, marginTop: 2 },
  routeCard: { margin: 16, marginBottom: 4, padding: 12, backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A" },
  selector: { backgroundColor: "#222", borderRadius: 8, padding: 10 }, selectorLabel: { color: "#94A3B8", fontSize: 11, marginBottom: 4 }, selectorValue: { flexDirection: "row", alignItems: "center", gap: 8 }, selectorText: { flex: 1, color: "#F5F3EF", fontSize: 13, fontWeight: "600" }, arrowDown: { alignSelf: "center", marginVertical: 5 },
  search: { height: 48, margin: 16, marginTop: 10, marginBottom: 10, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A" }, searchInput: { flex: 1, color: "#F5F3EF", marginLeft: 10 }, list: { paddingHorizontal: 16, paddingBottom: 16 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginBottom: 8, backgroundColor: "#1A1A1A", borderRadius: 12, borderWidth: 1, borderColor: "#2A2A2A" }, itemSelected: { borderColor: "#E07A2F" }, itemName: { color: "#F5F3EF", fontWeight: "600", fontSize: 15 }, itemMeta: { color: "#94A3B8", fontSize: 12, marginTop: 3 }, quantity: { width: 76, height: 40, color: "#F5F3EF", textAlign: "center", backgroundColor: "#2A2A2A", borderRadius: 8, borderWidth: 1, borderColor: "#3F3F3F", fontWeight: "700" }, empty: { color: "#94A3B8", textAlign: "center", marginTop: 36, paddingHorizontal: 24 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#1A1A1A", borderTopWidth: 1, borderTopColor: "#2A2A2A" }, footerText: { flex: 1, color: "#B8B3A8", fontSize: 13 }, count: { color: "#E07A2F", fontWeight: "700" }, submit: { paddingHorizontal: 13, paddingVertical: 12, backgroundColor: "#E07A2F", borderRadius: 9 }, submitDisabled: { backgroundColor: "#4A4A4A" }, submitText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.62)" }, sheet: { maxHeight: "70%", backgroundColor: "#1A1A1A", borderTopLeftRadius: 20, borderTopRightRadius: 20 }, sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: "#2A2A2A" }, sheetTitle: { color: "#F5F3EF", fontSize: 16, fontWeight: "700" }, pickerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingVertical: 14 }, pickerName: { color: "#F5F3EF", fontSize: 14, fontWeight: "600" },
});
