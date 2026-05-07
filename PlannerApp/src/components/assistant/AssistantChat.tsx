import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { colors, radius, shadow } from "@/constants/theme";
import { useAssistantChat, ChatMessage, ProfileCard } from "@/hooks/useAssistantChat";

type Props = {
  visible: boolean;
  onClose: () => void;
  eventId?: string;
};

export function AssistantChat({ visible, onClose, eventId }: Props) {
  const { messages, sending, error, sendMessage, clearMessages, suggestedPrompts } =
    useAssistantChat(eventId);
  const [input, setInput] = useState("");
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (visible) clearMessages();
  }, [visible]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarEmoji}>✨</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Plania</Text>
              <Text style={styles.headerSub}>Asistente de eventos</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          {/* Messages */}
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 18 }}
                style={styles.emptyInner}
              >
                <View style={styles.emptyIcon}>
                  <Text style={{ fontSize: 36 }}>✨</Text>
                </View>
                <Text style={styles.emptyTitle}>¿En qué te ayudo hoy?</Text>
                <Text style={styles.emptySub}>
                  Pregúntame sobre proveedores, planners o cómo optimizar tu agenda.
                </Text>
                <View style={styles.suggestionsContainer}>
                  {suggestedPrompts.map((prompt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.suggestionChip}
                      onPress={() => handleSuggestion(prompt)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.suggestionText}>{prompt}</Text>
                      <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </MotiView>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.messageList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <MessageBubble message={item} isLast={index === messages.length - 1} />
              )}
            />
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBar}>
              <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function MessageBubble({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  const isUser = message.role === "user";
  const hasCards = !isUser && (message.cards?.length ?? 0) > 0;

  if (hasCards) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 8 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 250 }}
        style={styles.botMsgWithCards}
      >
        <View style={[styles.bubbleWrapper, styles.bubbleLeft]}>
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 14 }}>✨</Text>
          </View>
          <View style={[styles.bubble, styles.bubbleBot]}>
            <Text style={styles.bubbleText}>{message.content}</Text>
          </View>
        </View>
        <View style={styles.cardsArea}>
          {message.cards!.map((card, i) => (
            <ProfileCardWidget key={i} card={card} />
          ))}
        </View>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 250 }}
      style={[styles.bubbleWrapper, isUser ? styles.bubbleRight : styles.bubbleLeft]}
    >
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 14 }}>✨</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        {message.loading ? (
          <View style={styles.typingRow}>
            <TypingDots />
            <Text style={styles.typingText}>Plania está pensando...</Text>
          </View>
        ) : (
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {message.content}
          </Text>
        )}
      </View>
    </MotiView>
  );
}

// ─── Profile Card Widget ─────────────────────────────────────────────────────

function ProfileCardWidget({ card }: { card: ProfileCard }) {
  const score = parseInt(card.matchScore);
  const scoreColor = score >= 75 ? "#16a34a" : score >= 55 ? "#d97706" : "#ef4444";
  const name = card.type === "planner" ? card.name : card.businessName;

  return (
    <View style={[pcStyles.card, { borderLeftColor: scoreColor }]}>
      {/* Score badge */}
      <View style={[pcStyles.scoreBadge, { backgroundColor: scoreColor + "18" }]}>
        <View style={[pcStyles.scoreDot, { backgroundColor: scoreColor }]} />
        <Text style={[pcStyles.scoreText, { color: scoreColor }]}>
          {card.matchScore} compatibilidad
        </Text>
      </View>

      {/* Name */}
      <Text style={pcStyles.name}>{name}</Text>

      {/* Tags row */}
      <View style={pcStyles.tagsRow}>
        {card.type === "planner" && card.experience !== "N/D" && (
          <View style={pcStyles.tag}>
            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
            <Text style={pcStyles.tagText}>{card.experience}</Text>
          </View>
        )}
        {card.type === "vendor" && (
          <View style={pcStyles.tag}>
            <Ionicons name="pricetag-outline" size={11} color={colors.textMuted} />
            <Text style={pcStyles.tagText}>{card.category}</Text>
          </View>
        )}
        {typeof card.rating === "number" && (
          <View style={pcStyles.tag}>
            <Ionicons name="star" size={11} color="#f59e0b" />
            <Text style={pcStyles.tagText}>{(card.rating as number).toFixed(1)}</Text>
          </View>
        )}
        {card.type === "vendor" && (
          <View style={pcStyles.tag}>
            <Ionicons name="cash-outline" size={11} color={colors.textMuted} />
            <Text style={pcStyles.tagText}>{card.estimatedPrice}</Text>
          </View>
        )}
      </View>

      {/* Specialties (planner) */}
      {card.type === "planner" && card.specialties.length > 0 && (
        <View style={pcStyles.chips}>
          {card.specialties.map((s, i) => (
            <View key={i} style={pcStyles.chip}>
              <Text style={pcStyles.chipText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Location (planner) */}
      {card.type === "planner" && card.cities.length > 0 && (
        <View style={pcStyles.locationRow}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={pcStyles.locationText}>{card.cities.join(", ")}</Text>
        </View>
      )}

      {/* Bio */}
      {card.bio ? (
        <Text style={pcStyles.bio} numberOfLines={2}>{card.bio}</Text>
      ) : null}
    </View>
  );
}

function TypingDots() {
  return (
    <View style={styles.dots}>
      {[0, 1, 2].map((i) => (
        <MotiView
          key={i}
          from={{ opacity: 0.3, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "timing", duration: 400, delay: i * 150, loop: true, repeatReverse: true }}
          style={styles.dot}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${colors.primary}40`,
  },
  avatarEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: "700", color: colors.textMain },
  headerSub: { fontSize: 12, color: colors.textMuted },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  emptyInner: { alignItems: "center", gap: 12, width: "100%" },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: `${colors.primary}30`,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.textMain, textAlign: "center" },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  suggestionsContainer: { width: "100%", gap: 8, marginTop: 8 },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    gap: 8,
    ...shadow.soft,
  },
  suggestionText: { flex: 1, fontSize: 13, color: colors.textMain, fontWeight: "500" },

  messageList: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 10 },
  bubbleWrapper: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleLeft: { justifyContent: "flex-start" },
  bubbleRight: { justifyContent: "flex-end" },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    padding: 12,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleBot: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  bubbleText: { fontSize: 14, color: colors.textMain, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  typingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  dots: { flexDirection: "row", gap: 4, alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },

  errorBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#fef2f2",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorText: { flex: 1, fontSize: 13, color: "#ef4444" },

  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textMain,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  sendBtnDisabled: { opacity: 0.4 },

  // ── Cards layout ──────────────────────────────────────────────────────────
  botMsgWithCards: { flexDirection: "column", gap: 8 },
  cardsArea: { marginLeft: 36, gap: 8 },
});

// ─── Profile card styles ─────────────────────────────────────────────────────

const pcStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    gap: 7,
    ...shadow.soft,
  },
  scoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    gap: 5,
  },
  scoreDot: { width: 6, height: 6, borderRadius: 3 },
  scoreText: { fontSize: 12, fontWeight: "700" },
  name: { fontSize: 14, fontWeight: "700", color: colors.textMain },
  tagsRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.background,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: { fontSize: 11, color: colors.textMuted, fontWeight: "500" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip: {
    backgroundColor: `${colors.primary}15`,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: radius.sm,
  },
  chipText: { fontSize: 11, color: colors.primary, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locationText: { fontSize: 11, color: colors.textMuted },
  bio: { fontSize: 12, color: colors.textMuted, lineHeight: 17, fontStyle: "italic" },
});
