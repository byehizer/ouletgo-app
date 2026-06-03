import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ReviewSummary } from '../api/reviewApi';
import { RatingStars } from './RatingStars';
import { Colors } from '../theme/colors';

const STAR_LABELS: Record<number, string> = {
  1: 'Muy malo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
};

const MAX_IMAGES = 4;

interface ReviewFormProps {
  title: string;
  subtitle?: string;
  thumbnailUrl?: string | null;
  /** Si true, muestra el picker de imágenes (solo reseñas de producto). */
  allowImages?: boolean;
  /** Reseña ya enviada — modo solo lectura. */
  existingReview?: ReviewSummary | null;
  onSubmit: (rating: number, comment: string, imageUris: string[]) => Promise<void>;
}

export function ReviewForm({
  title,
  subtitle,
  thumbnailUrl,
  allowImages = false,
  existingReview,
  onSubmit,
}: ReviewFormProps) {
  const readOnly = Boolean(existingReview);
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? '');
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Permití el acceso a fotos para adjuntar imágenes.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_IMAGES - imageUris.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    const newUris = result.assets.map((a) => a.uri);
    setImageUris((prev) => [...prev, ...newUris].slice(0, MAX_IMAGES));
  };

  const removeImage = (idx: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (readOnly || rating < 1) {
      setError('Elegí una calificación de 1 a 5 estrellas.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      await onSubmit(rating, comment.trim(), imageUris);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la reseña.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.card, readOnly && styles.cardReadOnly]}>
      <View style={styles.header}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Ionicons
              name={subtitle?.includes('tienda') ? 'storefront' : 'shirt-outline'}
              size={22}
              color={Colors.brand.DEFAULT}
            />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {readOnly ? (
          <View style={styles.doneBadge}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.success.text} />
            <Text style={styles.doneText}>Enviada</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.label}>Calificación</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => !readOnly && setRating(star)}
            disabled={readOnly}
            hitSlop={6}
            accessibilityLabel={`${star} estrellas`}
          >
            <Ionicons
              name={rating >= star ? 'star' : 'star-outline'}
              size={readOnly ? 22 : 34}
              color="#F59E0B"
            />
          </Pressable>
        ))}
      </View>
      {rating > 0 ? (
        <Text style={styles.starHint}>{STAR_LABELS[rating]}</Text>
      ) : null}

      {readOnly && existingReview ? (
        <View style={styles.readOnlyBlock}>
          <RatingStars rating={existingReview.rating} size={16} />
          {existingReview.comment ? (
            <Text style={styles.readOnlyComment}>{existingReview.comment}</Text>
          ) : (
            <Text style={styles.readOnlyMuted}>Sin comentario</Text>
          )}
          {existingReview.imageUrls && existingReview.imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesRow}
              contentContainerStyle={styles.imagesRowContent}
            >
              {existingReview.imageUrls.map((url) => (
                <Image key={url} source={{ uri: url }} style={styles.imgThumb} />
              ))}
            </ScrollView>
          ) : null}
        </View>
      ) : (
        <>
          <Text style={styles.label}>Comentario (opcional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Contanos tu experiencia..."
            placeholderTextColor={Colors.text.muted}
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={500}
            editable={!sending}
          />

          {allowImages ? (
            <>
              <Text style={styles.label}>
                Fotos (opcional · hasta {MAX_IMAGES})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imagesRow}
                contentContainerStyle={styles.imagesRowContent}
              >
                {imageUris.map((uri, idx) => (
                  <View key={uri} style={styles.imgWrap}>
                    <Image source={{ uri }} style={styles.imgThumb} />
                    <Pressable
                      onPress={() => removeImage(idx)}
                      style={styles.imgRemove}
                      hitSlop={4}
                    >
                      <Ionicons name="close-circle" size={22} color={Colors.danger.DEFAULT} />
                    </Pressable>
                  </View>
                ))}
                {imageUris.length < MAX_IMAGES ? (
                  <Pressable
                    onPress={() => void handlePickImages()}
                    disabled={sending}
                    style={styles.imgAdd}
                  >
                    <Ionicons name="camera-outline" size={26} color={Colors.brand.DEFAULT} />
                    <Text style={styles.imgAddText}>Agregar foto</Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            onPress={() => void handleSubmit()}
            disabled={sending || rating < 1}
            style={[styles.submitBtn, (sending || rating < 1) && styles.submitBtnDisabled]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar reseña</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    padding: 16,
    marginBottom: 14,
  },
  cardReadOnly: {
    backgroundColor: Colors.success.bg,
    borderColor: '#BBF7D0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.neutral.bg,
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success.text,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  starHint: {
    fontSize: 13,
    color: Colors.warning.text,
    fontWeight: '600',
    marginBottom: 12,
  },
  readOnlyBlock: {
    gap: 8,
    marginTop: 4,
  },
  readOnlyComment: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 21,
  },
  readOnlyMuted: {
    fontSize: 13,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  imagesRow: {
    marginBottom: 12,
  },
  imagesRowContent: {
    gap: 8,
    paddingVertical: 4,
  },
  imgWrap: {
    position: 'relative',
  },
  imgThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.neutral.bg,
  },
  imgRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.surface.card,
    borderRadius: 12,
  },
  imgAdd: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.brand.light,
    backgroundColor: Colors.brand.bgLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imgAddText: {
    fontSize: 10,
    color: Colors.brand.DEFAULT,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    minHeight: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border.DEFAULT,
    backgroundColor: Colors.surface.base,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text.primary,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  error: {
    fontSize: 13,
    color: Colors.danger.text,
    marginBottom: 10,
  },
  submitBtn: {
    backgroundColor: Colors.brand.DEFAULT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
