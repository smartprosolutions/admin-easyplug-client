import React, { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Paper,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gradientPrimary } from "../../theme/theme";
import {
  extractRatings,
  getListingRatings,
  replyToListingReview,
  resolveRatingId,
} from "../../services/ratingService";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const resolveAvatarUrl = (raw) => {
  if (!raw || typeof raw !== "string") return "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
  if (!API_ORIGIN) return raw;
  if (raw.startsWith("/")) return `${API_ORIGIN}${raw}`;
  return `${API_ORIGIN}/${raw}`;
};

const reviewerNameFrom = (review) => {
  const firstName =
    review?.user?.firstName || review?.rater?.firstName || "";
  const lastName = review?.user?.lastName || review?.rater?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return (
    review?.raterName ||
    review?.reviewerName ||
    review?.authorName ||
    fullName ||
    "Anonymous"
  );
};

const replyFrom = (review) =>
  String(review?.reply || review?.sellerReply || review?.ownerReply || "").trim();

const replyLabelFrom = (review) => {
  const role = String(
    review?.repliedBy?.userType || review?.repliedByRole || "",
  )
    .trim()
    .toLowerCase();
  if (role === "admin" || role === "superadmin") return "Admin reply";
  return "Lister reply";
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

export default function ListingReviewsPanel({ listingId, canReply = false }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [activeReplyId, setActiveReplyId] = useState("");

  const queryKey = ["listingRatings", listingId, page];
  const { data, isPending, isError, error } = useQuery({
    queryKey,
    queryFn: () => getListingRatings(listingId, { page, pageSize: 10 }),
    enabled: Boolean(listingId),
  });

  const reviews = useMemo(() => extractRatings(data), [data]);
  const totalPages = Number(data?.totalPages || 1);
  const ratingsCount = Number(data?.ratingsCount || reviews.length || 0);
  const averageRating = Number(data?.averageRating || 0);

  const replyMutation = useMutation({
    mutationFn: ({ ratingId, reply }) => replyToListingReview(ratingId, reply),
    onSuccess: async (_data, variables) => {
      setSuccessMsg("Reply posted. You can only reply once per review.");
      setErrorMsg("");
      setActiveReplyId("");
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[variables.ratingId];
        return next;
      });
      await queryClient.invalidateQueries({
        queryKey: ["listingRatings", listingId],
      });
    },
    onError: (err) => {
      setSuccessMsg("");
      setErrorMsg(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to post reply.",
      );
    },
  });

  const handleReply = (review) => {
    const ratingId = resolveRatingId(review);
    const reply = String(drafts[ratingId] || "").trim();
    if (!ratingId || !reply || replyMutation.isPending) return;
    setActiveReplyId(String(ratingId));
    replyMutation.mutate({ ratingId, reply });
  };

  if (!listingId) return null;

  return (
    <Box id="listing-reviews" sx={{ mt: 3 }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
        <RateReviewOutlinedIcon color="primary" fontSize="small" />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{
            background: gradientPrimary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Listing Reviews
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {canReply
          ? "Reply to customer reviews on this listing. You can reply only once per review."
          : "Customer reviews on this listing."}
      </Typography>

      {successMsg ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      ) : null}
      {errorMsg ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg("")}>
          {errorMsg}
        </Alert>
      ) : null}

      {isPending ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Box>
      ) : isError ? (
        <Alert severity="error">
          {error?.response?.data?.message ||
            error?.message ||
            "Failed to load reviews."}
        </Alert>
      ) : (
        <>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <Rating value={averageRating} precision={0.1} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {averageRating ? averageRating.toFixed(1) : "0.0"} · {ratingsCount}{" "}
              review{ratingsCount === 1 ? "" : "s"}
            </Typography>
          </Stack>

          {reviews.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 2,
                borderStyle: "dashed",
                textAlign: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">No reviews on this listing yet.</Typography>
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {reviews.map((review) => {
                const ratingId = resolveRatingId(review);
                const name = reviewerNameFrom(review);
                const avatar = resolveAvatarUrl(
                  review?.user?.profilePicture ||
                    review?.user?.avatar ||
                    review?.reviewerAvatar ||
                    "",
                );
                const existingReply = replyFrom(review);
                const draft = drafts[ratingId] || "";
                const isSending =
                  replyMutation.isPending &&
                  String(activeReplyId) === String(ratingId);

                return (
                  <Paper
                    key={String(ratingId)}
                    variant="outlined"
                    sx={{ p: 1.75, borderRadius: 2 }}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar src={avatar || undefined} sx={{ width: 32, height: 32 }}>
                        {String(name || "A").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography fontSize={14} fontWeight={700} noWrap>
                          {name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Box>
                      <Rating
                        value={Number(review.rating || 0)}
                        readOnly
                        size="small"
                      />
                    </Stack>
                    {review.comment ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1.25 }}
                      >
                        {review.comment}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 1.25, fontStyle: "italic" }}
                      >
                        No written comment.
                      </Typography>
                    )}

                    {existingReply ? (
                      <Box
                        sx={{
                          mt: 1.5,
                          pl: 1.5,
                          py: 1,
                          borderLeft: "3px solid",
                          borderColor: "primary.main",
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.06),
                          borderRadius: "0 8px 8px 0",
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="primary.main"
                        >
                          {replyLabelFrom(review)}
                        </Typography>
                        {review.repliedAt ? (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1 }}
                          >
                            {formatDate(review.repliedAt)}
                          </Typography>
                        ) : null}
                        <Typography variant="body2" sx={{ mt: 0.4 }}>
                          {existingReply}
                        </Typography>
                      </Box>
                    ) : canReply ? (
                      <Box sx={{ mt: 1.5 }}>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          size="small"
                          placeholder="Write a reply to this review..."
                          value={draft}
                          onChange={(e) =>
                            setDrafts((prev) => ({
                              ...prev,
                              [ratingId]: e.target.value,
                            }))
                          }
                          disabled={isSending}
                        />
                        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={!draft.trim() || isSending}
                            onClick={() => handleReply(review)}
                            sx={{
                              background: gradientPrimary,
                              color: "#fff",
                              boxShadow: "none",
                              "&:hover": { opacity: 0.92, boxShadow: "none" },
                            }}
                          >
                            {isSending ? "Posting..." : "Post reply"}
                          </Button>
                        </Stack>
                      </Box>
                    ) : null}
                  </Paper>
                );
              })}
            </Stack>
          )}

          {totalPages > 1 ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  size="small"
                  disabled={page <= 1 || isPending}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="small"
                  disabled={page >= totalPages || isPending}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </Stack>
            </>
          ) : null}
        </>
      )}
    </Box>
  );
}
