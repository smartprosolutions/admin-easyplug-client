import AssignmentTurnedInRoundedIcon from "@mui/icons-material/AssignmentTurnedInRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import QuizRoundedIcon from "@mui/icons-material/QuizRounded";
import VerifiedRoundedIcon from "@mui/icons-material/VerifiedRounded";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useQuery } from "@tanstack/react-query";
import { Link as RouterLink } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useUserProfileQuery } from "../services/queries";
import {
  isAdminRole,
  isSellerRole,
  resolveUserId,
  resolveUserRole,
} from "../utils/accessControl";

const typeColorMap = {
  success: "success",
  info: "info",
  warning: "warning",
  error: "error",
};

function formatCompact(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-ZA");
}

function formatCurrency(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "R 0.00";
  return `R ${n.toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getMonthKey(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  if (!year || !month) return "-";
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-ZA", { month: "short" });
}

function buildLastNMonths(n) {
  const now = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function timeAgo(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} day ago${days > 1 ? "s" : ""}`;
}

function SummaryCard({ label, count, sub, icon, accent, to, theme, loading }) {
  const accentColor =
    accent === "success"
      ? theme.palette.success.main
      : accent === "info"
        ? theme.palette.info.main
        : accent === "warning"
          ? theme.palette.warning.main
          : accent === "secondary"
            ? theme.palette.secondary.main
            : theme.palette.primary.main;

  return (
    <Paper
      component={RouterLink}
      to={to}
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1.5,
        border: `1px solid ${alpha(theme.palette.primary.dark, 0.25)}`,
        backgroundColor: theme.palette.background.paper,
        textDecoration: "none",
        display: "block",
        borderLeft: `4px solid ${accentColor}`,
        transition: "box-shadow 150ms ease, transform 150ms ease",
        "&:hover": {
          boxShadow: `0 4px 20px ${alpha(accentColor, 0.22)}`,
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {label}
        </Typography>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: alpha(accentColor, 0.12),
            color: accentColor,
          }}
        >
          {icon}
        </Avatar>
      </Stack>
      {loading ? (
        <Skeleton variant="text" width={80} height={48} />
      ) : (
        <Typography
          variant="h4"
          fontWeight={800}
          lineHeight={1}
          letterSpacing={-0.4}
          color="text.primary"
        >
          {count}
        </Typography>
      )}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ mt: 0.5, display: "block" }}
      >
        {sub}
      </Typography>
    </Paper>
  );
}

async function fetchDashboardInsights() {
  const [usersResp, listingsResp, txResp] = await Promise.allSettled([
    axiosClient.get("/users"),
    axiosClient.get("/listings/admin/all"),
    axiosClient.get("/transactions"),
  ]);

  const users =
    usersResp.status === "fulfilled" ? usersResp.value?.data?.users || [] : [];
  const listings =
    listingsResp.status === "fulfilled"
      ? listingsResp.value?.data?.listings || []
      : [];
  const transactions =
    txResp.status === "fulfilled" ? txResp.value?.data?.transactions || [] : [];

  const usersTotal = users.length;
  const sellersTotal = users.filter(
    (u) => String(u?.role || "").toLowerCase() === "seller",
  ).length;
  const activeUsersTotal = users.filter(
    (u) => String(u?.status || "").toLowerCase() === "active",
  ).length;

  const activeListings = listings.filter(
    (l) => String(l?.status || "").toLowerCase() === "active",
  );
  const totalListings = listings.length;
  const adListings = listings.filter((l) => Boolean(l?.isAdvertisement));
  const standardListings = listings.filter((l) => !l?.isAdvertisement);

  const totalTransactionValue = transactions.reduce(
    (sum, t) => sum + Number(t?.amount || 0),
    0,
  );
  const completedTransactions = transactions.filter(
    (t) => String(t?.status || "").toLowerCase() === "completed",
  );
  const completedValue = completedTransactions.reduce(
    (sum, t) => sum + Number(t?.amount || 0),
    0,
  );

  const monthBuckets = buildLastNMonths(6);
  const usersByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));
  const listingsByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));
  const txByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));

  users.forEach((u) => {
    const key = getMonthKey(u?.createdAt);
    if (key && usersByMonthMap.has(key)) {
      usersByMonthMap.set(key, (usersByMonthMap.get(key) || 0) + 1);
    }
  });

  listings.forEach((l) => {
    const key = getMonthKey(l?.createdAt);
    if (key && listingsByMonthMap.has(key)) {
      listingsByMonthMap.set(key, (listingsByMonthMap.get(key) || 0) + 1);
    }
  });

  transactions.forEach((t) => {
    const key = getMonthKey(t?.createdAt);
    if (key && txByMonthMap.has(key)) {
      txByMonthMap.set(key, (txByMonthMap.get(key) || 0) + 1);
    }
  });

  const categoryMap = new Map();
  activeListings.forEach((l) => {
    const category = String(l?.category || "Uncategorized").trim();
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  const txStatusMap = new Map();
  transactions.forEach((t) => {
    const status = String(t?.status || "unknown").toLowerCase();
    txStatusMap.set(status, (txStatusMap.get(status) || 0) + 1);
  });

  const listingStatusMap = new Map();
  listings.forEach((l) => {
    const status = String(l?.status || "unknown").toLowerCase();
    listingStatusMap.set(status, (listingStatusMap.get(status) || 0) + 1);
  });

  const usersMap = new Map(users.map((u) => [u?.userId, u]));
  const sellerListingsMap = new Map();
  listings.forEach((l) => {
    const sellerId = l?.sellerId;
    if (!sellerId) return;
    sellerListingsMap.set(sellerId, (sellerListingsMap.get(sellerId) || 0) + 1);
  });

  const topSellers = [...sellerListingsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([sellerId, listingCount]) => {
      const seller = usersMap.get(sellerId);
      return {
        sellerId,
        name:
          seller?.firstName || seller?.lastName
            ? `${seller?.firstName || ""} ${seller?.lastName || ""}`.trim()
            : seller?.email || "Unknown seller",
        listingCount,
      };
    });

  const recentActivity = [
    ...users.slice(-4).map((u) => ({
      id: `u-${u.userId}`,
      event: `New user joined: ${u.firstName || ""} ${u.lastName || ""}`.trim(),
      time: timeAgo(u.createdAt),
      type: "info",
      createdAt: u.createdAt,
    })),
    ...listings.slice(-4).map((l) => ({
      id: `l-${l.listingId}`,
      event: `Listing published: ${l.title || "Untitled listing"}`,
      time: timeAgo(l.createdAt),
      type: "success",
      createdAt: l.createdAt,
    })),
    ...transactions.slice(-4).map((t) => ({
      id: `t-${t.transactionId}`,
      event: `Transaction ${t.status || "updated"}: ${formatCurrency(t.amount)}`,
      time: timeAgo(t.createdAt),
      type:
        String(t?.status || "").toLowerCase() === "completed"
          ? "success"
          : "warning",
      createdAt: t.createdAt,
    })),
  ]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const conversionRate =
    totalListings > 0
      ? Number(((transactions.length / totalListings) * 100).toFixed(1))
      : 0;

  return {
    totals: {
      usersTotal,
      sellersTotal,
      activeUsersTotal,
      totalListings,
      activeListings: activeListings.length,
      adListings: adListings.length,
      standardListings: standardListings.length,
      transactionsTotal: transactions.length,
      totalTransactionValue,
      completedValue,
      conversionRate,
    },
    monthly: {
      labels: monthBuckets.map(toMonthLabel),
      users: monthBuckets.map((m) => usersByMonthMap.get(m) || 0),
      listings: monthBuckets.map((m) => listingsByMonthMap.get(m) || 0),
      transactions: monthBuckets.map((m) => txByMonthMap.get(m) || 0),
    },
    topCategories,
    txStatus: [...txStatusMap.entries()].map(([status, count], idx) => ({
      id: idx,
      label: status,
      value: count,
    })),
    listingStatus: [...listingStatusMap.entries()].map(
      ([status, count], idx) => ({
        id: idx,
        label: status,
        value: count,
      }),
    ),
    topSellers,
    recentActivity,
  };
}

async function fetchSellerDashboardInsights(userId) {
  const [listingsResp, txResp] = await Promise.allSettled([
    axiosClient.get("/listings/me"),
    axiosClient.get("/transactions"),
  ]);

  const listings =
    listingsResp.status === "fulfilled"
      ? listingsResp.value?.data?.listings || []
      : [];

  const allTransactions =
    txResp.status === "fulfilled" ? txResp.value?.data?.transactions || [] : [];

  const transactions = (allTransactions || []).filter(
    (t) => String(t?.sellerId || "") === String(userId || ""),
  );

  const activeListings = listings.filter(
    (l) => String(l?.status || "").toLowerCase() === "active",
  );
  const adListings = listings.filter((l) => Boolean(l?.isAdvertisement));
  const standardListings = listings.filter((l) => !l?.isAdvertisement);

  const totalTransactionValue = transactions.reduce(
    (sum, t) => sum + Number(t?.amount || 0),
    0,
  );
  const completedTransactions = transactions.filter(
    (t) => String(t?.status || "").toLowerCase() === "completed",
  );
  const completedValue = completedTransactions.reduce(
    (sum, t) => sum + Number(t?.amount || 0),
    0,
  );

  const monthBuckets = buildLastNMonths(6);
  const listingsByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));
  const txByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));
  const adsByMonthMap = new Map(monthBuckets.map((m) => [m, 0]));

  listings.forEach((l) => {
    const key = getMonthKey(l?.createdAt);
    if (key && listingsByMonthMap.has(key)) {
      listingsByMonthMap.set(key, (listingsByMonthMap.get(key) || 0) + 1);
      if (l?.isAdvertisement) {
        adsByMonthMap.set(key, (adsByMonthMap.get(key) || 0) + 1);
      }
    }
  });

  transactions.forEach((t) => {
    const key = getMonthKey(t?.createdAt);
    if (key && txByMonthMap.has(key)) {
      txByMonthMap.set(key, (txByMonthMap.get(key) || 0) + 1);
    }
  });

  const categoryMap = new Map();
  activeListings.forEach((l) => {
    const category = String(l?.category || "Uncategorized").trim();
    categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
  });

  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, count]) => ({ category, count }));

  const txStatusMap = new Map();
  transactions.forEach((t) => {
    const status = String(t?.status || "unknown").toLowerCase();
    txStatusMap.set(status, (txStatusMap.get(status) || 0) + 1);
  });

  const listingStatusMap = new Map();
  listings.forEach((l) => {
    const status = String(l?.status || "unknown").toLowerCase();
    listingStatusMap.set(status, (listingStatusMap.get(status) || 0) + 1);
  });

  const recentActivity = [
    ...listings.slice(-6).map((l) => ({
      id: `l-${l.listingId}`,
      event: `Listing updated: ${l.title || "Untitled listing"}`,
      time: timeAgo(l.updatedAt || l.createdAt),
      type: String(l?.status || "").toLowerCase() === "active" ? "success" : "info",
      createdAt: l.updatedAt || l.createdAt,
    })),
    ...transactions.slice(-6).map((t) => ({
      id: `t-${t.transactionId}`,
      event: `Order ${String(t.status || "updated").toLowerCase()}: ${formatCurrency(t.amount)}`,
      time: timeAgo(t.createdAt),
      type:
        String(t?.status || "").toLowerCase() === "completed"
          ? "success"
          : String(t?.status || "").toLowerCase() === "failed"
            ? "error"
            : "warning",
      createdAt: t.createdAt,
    })),
  ]
    .filter((item) => item.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  const conversionRate =
    listings.length > 0
      ? Number(((transactions.length / listings.length) * 100).toFixed(1))
      : 0;

  const avgTicketValue =
    transactions.length > 0
      ? Number((totalTransactionValue / transactions.length).toFixed(2))
      : 0;

  return {
    totals: {
      totalListings: listings.length,
      activeListings: activeListings.length,
      adListings: adListings.length,
      standardListings: standardListings.length,
      transactionsTotal: transactions.length,
      totalTransactionValue,
      completedValue,
      conversionRate,
      avgTicketValue,
      completedTransactions: completedTransactions.length,
    },
    monthly: {
      labels: monthBuckets.map(toMonthLabel),
      listings: monthBuckets.map((m) => listingsByMonthMap.get(m) || 0),
      transactions: monthBuckets.map((m) => txByMonthMap.get(m) || 0),
      ads: monthBuckets.map((m) => adsByMonthMap.get(m) || 0),
    },
    topCategories,
    txStatus: [...txStatusMap.entries()].map(([status, count], idx) => ({
      id: idx,
      label: status,
      value: count,
    })),
    listingStatus: [...listingStatusMap.entries()].map(
      ([status, count], idx) => ({
        id: idx,
        label: status,
        value: count,
      }),
    ),
    topSellers: [],
    recentActivity,
  };
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { data: profileData, isLoading: isProfileLoading } = useUserProfileQuery({
    retry: false,
  });
  const role = resolveUserRole(profileData);
  const currentUserId = resolveUserId(profileData);
  const isSeller = isSellerRole(role);
  const isAdmin = isAdminRole(role);
  const canLoadInsights = isAdmin || (isSeller && Boolean(currentUserId));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard-insights", role || "unknown", currentUserId || "none"],
    queryFn: () =>
      isSeller
        ? fetchSellerDashboardInsights(currentUserId)
        : fetchDashboardInsights(),
    enabled: !isProfileLoading && canLoadInsights,
    staleTime: 60 * 1000,
  });

  const totals = data?.totals || {};

  const summaryCards = isSeller
    ? [
        {
          label: "My Listings",
          count: formatCompact(totals.totalListings),
          sub: `${formatCompact(totals.activeListings)} active now`,
          icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
          to: "/inventory",
          accent: "primary",
        },
        {
          label: "Promoted Ads",
          count: formatCompact(totals.adListings),
          sub: `${formatCompact(totals.standardListings)} standard listings`,
          icon: <VerifiedRoundedIcon fontSize="small" />,
          to: "/advertisements",
          accent: "warning",
        },
        {
          label: "Orders",
          count: formatCompact(totals.transactionsTotal),
          sub: `Gross value: ${formatCurrency(totals.totalTransactionValue)}`,
          icon: <QuizRoundedIcon fontSize="small" />,
          to: "/messages",
          accent: "info",
        },
        {
          label: "Completed Revenue",
          count: formatCurrency(totals.completedValue),
          sub: `${formatCompact(totals.completedTransactions)} completed`,
          icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
          to: "/messages",
          accent: "success",
        },
        {
          label: "Average Ticket",
          count: formatCurrency(totals.avgTicketValue),
          sub: "Per order average",
          icon: <CalendarMonthRoundedIcon fontSize="small" />,
          to: "/messages",
          accent: "secondary",
        },
        {
          label: "Conversion Proxy",
          count: `${Number(totals.conversionRate || 0).toFixed(1)}%`,
          sub: "Orders to listings ratio",
          icon: <InboxRoundedIcon fontSize="small" />,
          to: "/inventory",
          accent: "info",
        },
      ]
    : [
        {
          label: "Total Users",
          count: formatCompact(totals.usersTotal),
          sub: `${formatCompact(totals.activeUsersTotal)} active users`,
          icon: <PeopleAltRoundedIcon fontSize="small" />,
          to: "/userManagement",
          accent: "info",
        },
        {
          label: "Active Sellers",
          count: formatCompact(totals.sellersTotal),
          sub: "Sellers currently on platform",
          icon: <GroupsRoundedIcon fontSize="small" />,
          to: "/userManagement",
          accent: "secondary",
        },
        {
          label: "Active Listings",
          count: formatCompact(totals.activeListings),
          sub: `${formatCompact(totals.standardListings)} standard listings live`,
          icon: <AssignmentTurnedInRoundedIcon fontSize="small" />,
          to: "/inventory",
          accent: "success",
        },
        {
          label: "Promoted Ads",
          count: formatCompact(totals.adListings),
          sub: "Paid visibility inventory",
          icon: <VerifiedRoundedIcon fontSize="small" />,
          to: "/advertisements",
          accent: "warning",
        },
        {
          label: "Transactions",
          count: formatCompact(totals.transactionsTotal),
          sub: `Value: ${formatCurrency(totals.totalTransactionValue)}`,
          icon: <QuizRoundedIcon fontSize="small" />,
          to: "/transactions",
          accent: "info",
        },
        {
          label: "Completed Revenue",
          count: formatCurrency(totals.completedValue),
          sub: `Conversion proxy: ${totals.conversionRate || 0}%`,
          icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
          to: "/transactions",
          accent: "success",
        },
      ];

  const growthData = data?.monthly || {
    labels: [],
    users: [],
    listings: [],
    transactions: [],
    ads: [],
  };
  const topCategories = data?.topCategories || [];
  const txStatusData = data?.txStatus || [];
  const listingStatusData = data?.listingStatus || [];
  const recentActivity = data?.recentActivity || [];
  const topSellers = data?.topSellers || [];

  const txCompletedCount =
    txStatusData.find(
      (x) => String(x?.label || "").toLowerCase() === "completed",
    )?.value || 0;
  const txPendingCount =
    txStatusData.find((x) => String(x?.label || "").toLowerCase() === "pending")
      ?.value || 0;
  const txFailedCount =
    txStatusData.find((x) => String(x?.label || "").toLowerCase() === "failed")
      ?.value || 0;

  const completionRate =
    Number(totals.transactionsTotal || 0) > 0
      ? Number(((txCompletedCount / totals.transactionsTotal) * 100).toFixed(1))
      : 0;

  const adShare =
    Number(totals.totalListings || 0) > 0
      ? Number(
          (
            (Number(totals.adListings || 0) /
              Number(totals.totalListings || 0)) *
            100
          ).toFixed(1),
        )
      : 0;

  const latestListings =
    growthData.listings[growthData.listings.length - 1] || 0;
  const prevListings = growthData.listings[growthData.listings.length - 2] || 0;
  const latestTransactions =
    growthData.transactions[growthData.transactions.length - 1] || 0;
  const prevTransactions =
    growthData.transactions[growthData.transactions.length - 2] || 0;

  const supplyTrendDirection = latestListings >= prevListings ? "up" : "down";
  const demandTrendDirection =
    latestTransactions >= prevTransactions ? "up" : "down";

  const topSellerShare =
    topSellers.length > 0 && Number(totals.totalListings || 0) > 0
      ? Number(
          ((topSellers[0].listingCount / totals.totalListings) * 100).toFixed(
            1,
          ),
        )
      : 0;

  const actionableInsights = isSeller
    ? [
        {
          title: "Order health",
          detail: `${completionRate}% completed (${txPendingCount} pending, ${txFailedCount} failed). Follow up pending orders quickly to improve cash flow.`,
          accent:
            completionRate >= 65
              ? "success"
              : completionRate >= 40
                ? "warning"
                : "error",
        },
        {
          title: "Promotion mix",
          detail: `${adShare}% of your listings are promoted. Increase promoted share for top performers when demand slows.`,
          accent: adShare >= 20 ? "success" : "warning",
        },
        {
          title: "Listing momentum",
          detail: `New listings are ${supplyTrendDirection} month-over-month (${prevListings} to ${latestListings}).`,
          accent: supplyTrendDirection === "up" ? "success" : "warning",
        },
        {
          title: "Sales momentum",
          detail: `Orders are ${demandTrendDirection} month-over-month (${prevTransactions} to ${latestTransactions}).`,
          accent: demandTrendDirection === "up" ? "success" : "warning",
        },
        {
          title: "Average ticket",
          detail: `Your average ticket is ${formatCurrency(totals.avgTicketValue)}. Use bundles and upsells to raise this over time.`,
          accent:
            Number(totals.avgTicketValue || 0) > 0 ? "info" : "warning",
        },
      ]
    : [
        {
          title: "Payment health",
          detail: `${completionRate}% completed (${txPendingCount} pending, ${txFailedCount} failed). Focus operations on pending-to-completed conversion.`,
          accent:
            completionRate >= 65
              ? "success"
              : completionRate >= 40
                ? "warning"
                : "error",
        },
        {
          title: "Inventory monetization mix",
          detail: `${adShare}% of listings are promoted ads. Target 25-35% ad share for balanced discoverability and revenue.`,
          accent: adShare >= 25 && adShare <= 35 ? "success" : "warning",
        },
        {
          title: "Supply trend",
          detail: `New listings are ${supplyTrendDirection} month-over-month (${prevListings} to ${latestListings}).`,
          accent: supplyTrendDirection === "up" ? "success" : "warning",
        },
        {
          title: "Demand trend",
          detail: `Transactions are ${demandTrendDirection} month-over-month (${prevTransactions} to ${latestTransactions}).`,
          accent: demandTrendDirection === "up" ? "success" : "warning",
        },
        {
          title: "Seller concentration risk",
          detail:
            topSellerShare > 0
              ? `Top seller controls ${topSellerShare}% of total listings. Monitor concentration and grow mid-tier seller supply.`
              : "No concentration signal available yet.",
          accent: topSellerShare > 20 ? "warning" : "info",
        },
      ];

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1.25, sm: 1.75, md: 1 },
      }}
    >
      <Typography
        variant="h5"
        fontWeight={700}
        color="primary.main"
        sx={{ mb: 0.5, fontSize: { xs: 22, sm: 28 } }}
      >
        {isSeller ? "Seller Dashboard" : "Dashboard"}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 } }}>
        {isSeller
          ? "Performance snapshot for your listings, adverts, and order outcomes."
          : "Business intelligence snapshot to support growth, retention, and revenue decisions."}
      </Typography>

      {!isProfileLoading && !canLoadInsights ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to resolve your role-specific dashboard data.
        </Alert>
      ) : null}

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard insights. {error?.message || "Please retry."}
        </Alert>
      ) : null}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {summaryCards.map((card) => (
          <Grid key={card.label} size={{ xs: 6, sm: 6, md: 4 }}>
            <SummaryCard {...card} theme={theme} loading={isLoading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              {isSeller
                ? "Your Performance Trend (Last 6 Months)"
                : "Platform Growth Trend (Last 6 Months)"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              {isSeller
                ? "Compare month-over-month listing, advert, and order activity."
                : "Compare month-over-month growth of users, listings, and transactions."}
            </Typography>
            {growthData.labels.length > 0 ? (
              <BarChart
                height={isMobile ? 200 : 230}
                xAxis={[
                  {
                    data: growthData.labels,
                    scaleType: "band",
                    label: "Month",
                  },
                ]}
                series={[
                  ...(isSeller
                    ? [
                        {
                          data: growthData.listings,
                          label: "Listings",
                          color: theme.palette.primary.main,
                        },
                        {
                          data: growthData.ads,
                          label: "Promoted Ads",
                          color: theme.palette.warning.main,
                        },
                        {
                          data: growthData.transactions,
                          label: "Orders",
                          color: theme.palette.success.main,
                        },
                      ]
                    : [
                        {
                          data: growthData.users,
                          label: "Users",
                          color: theme.palette.info.main,
                        },
                        {
                          data: growthData.listings,
                          label: "Listings",
                          color: theme.palette.primary.main,
                        },
                        {
                          data: growthData.transactions,
                          label: "Transactions",
                          color: theme.palette.success.main,
                        },
                      ]),
                ]}
                margin={{ top: 10, bottom: 40, left: 40, right: 10 }}
                sx={{ "& .MuiChartsAxis-tickLabel": { fontSize: 12 } }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ height: 230, color: "text.disabled" }}
              >
                <InboxRoundedIcon sx={{ fontSize: 48 }} />
                <Typography variant="body2" color="text.disabled">
                  No growth data available
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Listing Mix
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Distribution of standard vs promoted inventory.
            </Typography>
            {totals.totalListings > 0 ? (
              <PieChart
                height={isMobile ? 200 : 230}
                series={[
                  {
                    data: [
                      {
                        id: 0,
                        label: "Standard",
                        value: totals.standardListings || 0,
                      },
                      { id: 1, label: "Ads", value: totals.adListings || 0 },
                    ],
                    innerRadius: 45,
                    outerRadius: 88,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    colors: [
                      theme.palette.primary.main,
                      theme.palette.warning.main,
                    ],
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                  },
                }}
                margin={{ top: 0, bottom: 10, left: 10, right: 10 }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ height: 230, color: "text.disabled" }}
              >
                <InboxRoundedIcon sx={{ fontSize: 48 }} />
                <Typography variant="body2" color="text.disabled">
                  No listing data available
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Top Active Categories
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Categories with the highest currently active listing volume.
            </Typography>
            {topCategories.length > 0 ? (
              <BarChart
                height={isMobile ? 200 : 230}
                xAxis={[
                  {
                    data: topCategories.map((x) => x.category),
                    scaleType: "band",
                    label: "Category",
                  },
                ]}
                series={[
                  {
                    data: topCategories.map((x) => x.count),
                    label: "Active Listings",
                    color: theme.palette.secondary.main,
                  },
                ]}
                margin={{ top: 10, bottom: 40, left: 40, right: 10 }}
                sx={{ "& .MuiChartsAxis-tickLabel": { fontSize: 11 } }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ height: 230, color: "text.disabled" }}
              >
                <InboxRoundedIcon sx={{ fontSize: 48 }} />
                <Typography variant="body2" color="text.disabled">
                  No category data available
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.5, sm: 2, md: 2.5 },
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
              Transaction Status
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Operational payment flow health by transaction status.
            </Typography>
            {txStatusData.length > 0 ? (
              <PieChart
                height={isMobile ? 200 : 230}
                series={[
                  {
                    data: txStatusData,
                    innerRadius: 45,
                    outerRadius: 88,
                    paddingAngle: 3,
                    cornerRadius: 4,
                    colors: [
                      theme.palette.success.main,
                      theme.palette.warning.main,
                      theme.palette.error.main,
                      theme.palette.info.main,
                    ],
                  },
                ]}
                slotProps={{
                  legend: {
                    direction: "column",
                    position: { vertical: "middle", horizontal: "right" },
                  },
                }}
                margin={{ top: 0, bottom: 10, left: 10, right: 10 }}
              />
            ) : (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ height: 230, color: "text.disabled" }}
              >
                <InboxRoundedIcon sx={{ fontSize: 48 }} />
                <Typography variant="body2" color="text.disabled">
                  No transaction data available
                </Typography>
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Recent Activity
            </Typography>
            {recentActivity.length === 0 ? (
              <Stack
                alignItems="center"
                justifyContent="center"
                spacing={1}
                sx={{ py: 4, color: "text.disabled" }}
              >
                <InboxRoundedIcon sx={{ fontSize: 48 }} />
                <Typography variant="body2" color="text.disabled">
                  No recent activity
                </Typography>
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                {recentActivity.map((item, idx) => (
                  <Stack
                    key={item.id ?? idx}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette.action.hover, 0.5),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Chip
                        size="small"
                        color={typeColorMap[item.type] || "default"}
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          p: 0,
                          minWidth: 8,
                        }}
                      />
                      <Typography variant="body2">{item.event}</Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ whiteSpace: "nowrap", ml: 2 }}
                    >
                      {item.time}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 2.5,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.primary.dark, 0.2)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ mb: 2 }}
            >
              <CalendarMonthRoundedIcon fontSize="small" color="primary" />
              <Typography variant="subtitle1" fontWeight={700}>
                Strategic Insights
              </Typography>
            </Stack>

            <Stack spacing={1.5}>
              {actionableInsights.map((insight) => {
                const accentColor =
                  insight.accent === "success"
                    ? theme.palette.success.main
                    : insight.accent === "warning"
                      ? theme.palette.warning.main
                      : insight.accent === "error"
                        ? theme.palette.error.main
                        : theme.palette.info.main;

                return (
                  <Paper
                    key={insight.title}
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      border: `1px solid ${alpha(accentColor, 0.25)}`,
                      bgcolor: alpha(accentColor, 0.04),
                    }}
                  >
                    <Typography variant="body2" fontWeight={700}>
                      {insight.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {insight.detail}
                    </Typography>
                  </Paper>
                );
              })}

              <Typography variant="subtitle2" fontWeight={700} sx={{ pt: 1 }}>
                {isSeller ? "My Listing Status" : "Top Sellers by Listing Volume"}
              </Typography>

              {isSeller ? null : topSellers.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No seller performance data available.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {topSellers.map((seller) => (
                    <Stack
                      key={seller.sellerId}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                    >
                      <Typography variant="body2" noWrap sx={{ mr: 1 }}>
                        {seller.name}
                      </Typography>
                      <Chip
                        label={`${seller.listingCount} listings`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                  ))}
                </Stack>
              )}

              {listingStatusData.length > 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ pt: 1, flexWrap: "wrap", rowGap: 1 }}
                >
                  {listingStatusData.map((statusRow) => (
                    <Chip
                      key={statusRow.label}
                      label={`${statusRow.label}: ${statusRow.value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
