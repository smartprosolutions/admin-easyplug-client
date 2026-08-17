import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { useQuery } from "@tanstack/react-query";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PaidIcon from "@mui/icons-material/Paid";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { getReportsSummary } from "../services/reportsService";
import {
  downloadCsv,
  formatExportDate,
  rowsToCsv,
} from "../utils/csvExport";
import { gradientPrimary } from "../theme/theme";

const PRESETS = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "ytd", label: "YTD" },
  { id: "all", label: "All time" },
];

function toInputDate(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function startOfDayIso(dateStr) {
  return `${dateStr}T00:00:00.000Z`;
}

function endOfDayIso(dateStr) {
  return `${dateStr}T23:59:59.999Z`;
}

function getPresetRange(presetId) {
  const now = new Date();
  const to = toInputDate(now);

  if (presetId === "all") {
    return { preset: "all", from: "", to: "", all: true };
  }

  if (presetId === "ytd") {
    return {
      preset: "ytd",
      from: `${now.getFullYear()}-01-01`,
      to,
      all: false,
    };
  }

  const days =
    presetId === "7d" ? 6 : presetId === "90d" ? 89 : 29;
  const fromDate = new Date(now);
  fromDate.setDate(fromDate.getDate() - days);
  return {
    preset: presetId,
    from: toInputDate(fromDate),
    to,
    all: false,
  };
}

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

function toMonthLabel(period) {
  const [year, month] = String(period || "").split("-");
  if (!year || !month) return period || "-";
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("en-ZA", { month: "short", year: "2-digit" });
}

function KpiCard({ label, value, sub, icon, accent, loading }) {
  const theme = useTheme();
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
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: "100%",
        borderLeft: `4px solid ${accentColor}`,
        bgcolor: alpha(accentColor, 0.03),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          {label}
        </Typography>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: alpha(accentColor, 0.12),
            color: accentColor,
          }}
        >
          {icon}
        </Box>
      </Stack>
      {loading ? (
        <Skeleton variant="text" width={90} height={42} />
      ) : (
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.75 }}>
          {value}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    </Paper>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, height: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
        spacing={1}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export default function Reports() {
  const theme = useTheme();
  const [range, setRange] = useState(() => getPresetRange("30d"));

  const queryParams = useMemo(() => {
    if (range.all) return { all: true };
    return {
      from: range.from ? startOfDayIso(range.from) : undefined,
      to: range.to ? endOfDayIso(range.to) : undefined,
    };
  }, [range]);

  const { data, isPending, isError, error, isFetching } = useQuery({
    queryKey: ["reports-summary", queryParams],
    queryFn: () => getReportsSummary(queryParams),
    staleTime: 60 * 1000,
  });

  const report = data?.data;
  const registrations = report?.registrations || {
    total: 0,
    byType: { user: 0, seller: 0, admin: 0 },
    series: [],
  };
  const sales = report?.sales || {
    closedCount: 0,
    revenue: 0,
    byStatus: {},
    series: [],
  };
  const usersStatus = report?.usersStatus || {
    active: 0,
    inactive: 0,
    sellersActive: 0,
    sellersInactive: 0,
  };
  const listings = report?.listings || {
    active: 0,
    draft: 0,
    expired: 0,
    sold: 0,
    inactive: 0,
    other: 0,
    soldInRange: 0,
  };

  const registrationLabels = useMemo(
    () => (registrations.series || []).map((row) => toMonthLabel(row.period)),
    [registrations.series],
  );
  const registrationBuyerSeries = useMemo(
    () => (registrations.series || []).map((row) => Number(row.user || 0)),
    [registrations.series],
  );
  const registrationSellerSeries = useMemo(
    () => (registrations.series || []).map((row) => Number(row.seller || 0)),
    [registrations.series],
  );
  const registrationAdminSeries = useMemo(
    () => (registrations.series || []).map((row) => Number(row.admin || 0)),
    [registrations.series],
  );

  const salesLabels = useMemo(
    () => (sales.series || []).map((row) => toMonthLabel(row.period)),
    [sales.series],
  );
  const salesCountSeries = useMemo(
    () => (sales.series || []).map((row) => Number(row.count || 0)),
    [sales.series],
  );
  const salesRevenueSeries = useMemo(
    () => (sales.series || []).map((row) => Number(row.revenue || 0)),
    [sales.series],
  );

  const salesStatusPie = useMemo(() => {
    const entries = Object.entries(sales.byStatus || {});
    if (!entries.length) {
      return [{ id: 0, value: 1, label: "No data", color: alpha("#9e9e9e", 0.5) }];
    }
    const palette = ["#4caf50", "#667eea", "#ff9800", "#f44336", "#00bcd4", "#9c27b0"];
    return entries.map(([status, info], index) => ({
      id: index,
      value: Number(info?.count || 0),
      label: status,
      color: palette[index % palette.length],
    }));
  }, [sales.byStatus]);

  const listingsPie = useMemo(() => {
    const items = [
      { label: "Active", value: listings.active, color: "#4caf50" },
      { label: "Draft", value: listings.draft, color: "#9e9e9e" },
      { label: "Expired", value: listings.expired, color: "#ff9800" },
      { label: "Sold", value: listings.sold, color: "#667eea" },
      { label: "Inactive", value: listings.inactive, color: "#f44336" },
      { label: "Other", value: listings.other, color: "#00bcd4" },
    ].filter((item) => item.value > 0);

    if (!items.length) {
      return [{ id: 0, value: 1, label: "No data", color: alpha("#9e9e9e", 0.5) }];
    }
    return items.map((item, index) => ({ id: index, ...item }));
  }, [listings]);

  const handlePreset = useCallback((_, value) => {
    if (!value) return;
    setRange(getPresetRange(value));
  }, []);

  const handleFromChange = useCallback((event) => {
    const from = event.target.value;
    setRange((prev) => ({
      ...prev,
      preset: "custom",
      all: false,
      from,
      to: prev.to || toInputDate(new Date()),
    }));
  }, []);

  const handleToChange = useCallback((event) => {
    const to = event.target.value;
    setRange((prev) => ({
      ...prev,
      preset: "custom",
      all: false,
      to,
      from: prev.from || to,
    }));
  }, []);

  const handleExport = useCallback(() => {
    const stamp = formatExportDate();
    const kpiRows = [
      { metric: "Registrations", value: registrations.total },
      { metric: "Registrations - Buyers", value: registrations.byType?.user || 0 },
      { metric: "Registrations - Sellers", value: registrations.byType?.seller || 0 },
      { metric: "Registrations - Admins", value: registrations.byType?.admin || 0 },
      { metric: "Closed sales", value: sales.closedCount },
      { metric: "Revenue", value: sales.revenue },
      { metric: "Listings sold (in range)", value: listings.soldInRange },
      { metric: "Active users", value: usersStatus.active },
      { metric: "Inactive users", value: usersStatus.inactive },
      { metric: "Active sellers", value: usersStatus.sellersActive },
      { metric: "Inactive sellers", value: usersStatus.sellersInactive },
      { metric: "Listings active", value: listings.active },
      { metric: "Listings draft", value: listings.draft },
      { metric: "Listings expired", value: listings.expired },
      { metric: "Listings sold (all)", value: listings.sold },
      { metric: "Listings inactive", value: listings.inactive },
    ];

    const kpiCsv = rowsToCsv(
      [
        { key: "metric", label: "Metric" },
        { key: "value", label: "Value" },
      ],
      kpiRows,
    );

    const regSeriesCsv = rowsToCsv(
      [
        { key: "period", label: "Period" },
        { key: "user", label: "Buyers" },
        { key: "seller", label: "Sellers" },
        { key: "admin", label: "Admins" },
        { key: "total", label: "Total" },
      ],
      registrations.series || [],
    );

    const salesSeriesCsv = rowsToCsv(
      [
        { key: "period", label: "Period" },
        { key: "count", label: "Closed sales" },
        { key: "revenue", label: "Revenue" },
      ],
      sales.series || [],
    );

    const combined = [
      "Reports KPI Summary",
      `Range,${range.all ? "All time" : `${range.from || ""} to ${range.to || ""}`}`,
      "",
      kpiCsv,
      "",
      "Registrations by month",
      regSeriesCsv,
      "",
      "Closed sales by month",
      salesSeriesCsv,
    ].join("\r\n");

    downloadCsv(`easyplug-reports-${stamp}.csv`, combined);
  }, [listings, range, registrations, sales, usersStatus]);

  const loading = isPending || isFetching;

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1.25, sm: 1.75, md: 1 },
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <AssessmentIcon sx={{ color: "#667eea" }} />
            <Typography
              variant="h5"
              fontWeight={700}
              color="primary.main"
              sx={{ fontSize: { xs: 22, sm: 28 } }}
            >
              Reports
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Registrations, closed sales, listings, and user activity for the
            selected period.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={loading || isError}
          sx={{
            backgroundImage: gradientPrimary,
            color: "#fff",
            borderRadius: 2,
            alignSelf: { xs: "stretch", md: "center" },
          }}
        >
          Export CSV
        </Button>
      </Stack>

      <Paper
        variant="outlined"
        sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, mb: 2 }}
      >
        <Stack spacing={1.5}>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={range.preset === "custom" ? null : range.preset}
            onChange={handlePreset}
            sx={{
              flexWrap: "wrap",
              gap: 0.75,
              "& .MuiToggleButton-root": {
                borderRadius: "8px !important",
                border: `1px solid ${alpha(theme.palette.primary.main, 0.25)} !important`,
                px: 1.5,
                textTransform: "none",
              },
            }}
          >
            {PRESETS.map((preset) => (
              <ToggleButton key={preset.id} value={preset.id}>
                {preset.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <TextField
              label="From"
              type="date"
              size="small"
              value={range.from}
              onChange={handleFromChange}
              disabled={range.all}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { sm: 180 } }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={range.to}
              onChange={handleToChange}
              disabled={range.all}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: { sm: 180 } }}
            />
            <Typography variant="caption" color="text.secondary">
              {range.all
                ? "Showing all-time totals"
                : `Showing ${range.from || "…"} → ${range.to || "…"}`}
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load reports.{" "}
          {error?.response?.data?.message || error?.message || "Please retry."}
        </Alert>
      ) : null}

      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          {
            label: "Registrations",
            value: formatCompact(registrations.total),
            sub: `${formatCompact(registrations.byType?.user)} buyers · ${formatCompact(registrations.byType?.seller)} sellers`,
            icon: <PeopleAltRoundedIcon fontSize="small" />,
            accent: "info",
          },
          {
            label: "Closed sales",
            value: formatCompact(sales.closedCount),
            sub: "Paid + completed transactions",
            icon: <CheckCircleOutlineRoundedIcon fontSize="small" />,
            accent: "success",
          },
          {
            label: "Revenue",
            value: formatCurrency(sales.revenue),
            sub: "From closed sales",
            icon: <PaidIcon fontSize="small" />,
            accent: "secondary",
          },
          {
            label: "Listings sold",
            value: formatCompact(listings.soldInRange),
            sub: `${formatCompact(listings.sold)} sold overall`,
            icon: <Inventory2RoundedIcon fontSize="small" />,
            accent: "warning",
          },
          {
            label: "Active users",
            value: formatCompact(usersStatus.active),
            sub: `${formatCompact(usersStatus.inactive)} inactive`,
            icon: <GroupsRoundedIcon fontSize="small" />,
            accent: "info",
          },
          {
            label: "Active sellers",
            value: formatCompact(usersStatus.sellersActive),
            sub: `${formatCompact(usersStatus.sellersInactive)} inactive sellers`,
            icon: <StorefrontIcon fontSize="small" />,
            accent: "primary",
          },
        ].map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <KpiCard {...card} loading={loading && !report} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard
            title="Registrations over time"
            action={
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`Buyers ${formatCompact(registrations.byType?.user)}`} />
                <Chip size="small" label={`Sellers ${formatCompact(registrations.byType?.seller)}`} color="secondary" />
                <Chip size="small" label={`Admins ${formatCompact(registrations.byType?.admin)}`} color="primary" />
              </Stack>
            }
          >
            {loading && !report ? (
              <Skeleton variant="rounded" height={280} />
            ) : registrationLabels.length === 0 ? (
              <Typography color="text.secondary" fontSize={13}>
                No registration data for this range.
              </Typography>
            ) : (
              <BarChart
                height={280}
                series={[
                  { data: registrationBuyerSeries, label: "Buyers", color: "#00bcd4", stack: "reg" },
                  { data: registrationSellerSeries, label: "Sellers", color: "#9c27b0", stack: "reg" },
                  { data: registrationAdminSeries, label: "Admins", color: "#667eea", stack: "reg" },
                ]}
                xAxis={[{ data: registrationLabels, scaleType: "band" }]}
                margin={{ left: 40, right: 10, top: 20, bottom: 30 }}
              />
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard title="Sales by status">
            {loading && !report ? (
              <Skeleton variant="rounded" height={280} />
            ) : (
              <PieChart
                height={280}
                series={[
                  {
                    data: salesStatusPie,
                    innerRadius: 45,
                    outerRadius: 95,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <SectionCard title="Closed sales & revenue over time">
            {loading && !report ? (
              <Skeleton variant="rounded" height={280} />
            ) : salesLabels.length === 0 ? (
              <Typography color="text.secondary" fontSize={13}>
                No closed sales in this range.
              </Typography>
            ) : (
              <Stack spacing={1}>
                <Typography variant="caption" color="text.secondary">
                  Closed sales count
                </Typography>
                <BarChart
                  height={140}
                  series={[
                    {
                      data: salesCountSeries,
                      label: "Closed sales",
                      color: "#4caf50",
                    },
                  ]}
                  xAxis={[{ data: salesLabels, scaleType: "band" }]}
                  margin={{ left: 40, right: 10, top: 10, bottom: 20 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Revenue (R)
                </Typography>
                <BarChart
                  height={140}
                  series={[
                    {
                      data: salesRevenueSeries,
                      label: "Revenue (R)",
                      color: "#667eea",
                    },
                  ]}
                  xAxis={[{ data: salesLabels, scaleType: "band" }]}
                  margin={{ left: 50, right: 10, top: 10, bottom: 20 }}
                />
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <SectionCard title="Users & sellers status">
            {loading && !report ? (
              <Skeleton variant="rounded" height={280} />
            ) : (
              <BarChart
                height={280}
                layout="horizontal"
                series={[
                  {
                    data: [
                      Number(usersStatus.active || 0),
                      Number(usersStatus.sellersActive || 0),
                    ],
                    label: "Active",
                    color: "#4caf50",
                    stack: "status",
                  },
                  {
                    data: [
                      Number(usersStatus.inactive || 0),
                      Number(usersStatus.sellersInactive || 0),
                    ],
                    label: "Inactive",
                    color: "#f44336",
                    stack: "status",
                  },
                ]}
                yAxis={[{ data: ["All users", "Sellers"], scaleType: "band", width: 80 }]}
                margin={{ left: 10, right: 10, top: 20, bottom: 30 }}
              />
            )}
          </SectionCard>
        </Grid>
      </Grid>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Listings overview">
            {loading && !report ? (
              <Skeleton variant="rounded" height={260} />
            ) : (
              <PieChart
                height={260}
                series={[
                  {
                    data: listingsPie,
                    innerRadius: 40,
                    outerRadius: 90,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
            )}
          </SectionCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionCard title="Listings breakdown">
            <Stack spacing={1}>
              {[
                ["Active", listings.active, "success"],
                ["Draft", listings.draft, "default"],
                ["Expired", listings.expired, "warning"],
                ["Sold", listings.sold, "primary"],
                ["Inactive", listings.inactive, "error"],
                ["Other", listings.other, "info"],
                ["Sold in selected range", listings.soldInRange, "secondary"],
              ].map(([label, value, color]) => (
                <Stack
                  key={label}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography fontSize={14}>{label}</Typography>
                  <Chip
                    size="small"
                    color={color}
                    label={formatCompact(value)}
                    sx={{ fontWeight: 700, minWidth: 64 }}
                  />
                </Stack>
              ))}
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
}
