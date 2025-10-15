import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import { PieChart } from "@mui/x-charts/PieChart";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import StatCard from "../components/metrics/StatCard";
import { Stack } from "@mui/material";

const dummy = {
  totals: {
    users: 4821,
    sellers: 812,
    items: 13457,
    standard: 9342,
    ads: 4115,
    transactions: 28790
  },
  monthly: {
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec"
    ],
    listingsStandard: [32, 45, 38, 52, 60, 66, 58, 61, 63, 59, 62, 70],
    listingsAds: [12, 18, 16, 21, 24, 29, 27, 30, 31, 28, 33, 35],
    newUsers: [120, 140, 135, 160, 170, 190, 180, 210, 205, 198, 220, 240]
  }
};

export default function Dashboard() {
  const { totals, monthly } = dummy;
  const inactiveUsers = monthly.newUsers.map((n) =>
    Math.max(10, Math.round(n * 0.35))
  );
  const activeUsersMonthly = monthly.newUsers.map((n, i) =>
    Math.max(0, n - inactiveUsers[i])
  );
  const activeUsersCurrent = activeUsersMonthly[activeUsersMonthly.length - 1];
  return (
    <Stack width="100%" spacing={2}>
      <Typography variant="h4" sx={{ fontWeight: 600 }}>
        Dashboard
      </Typography>
      <Grid container spacing={2} columns={20} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 20, md: 4 }}>
          <StatCard
            title="All Users"
            value={totals.users}
            icon={GroupRoundedIcon}
          />
        </Grid>
        <Grid item size={{ xs: 20, md: 4 }}>
          <StatCard
            title="All Sellers"
            value={totals.sellers}
            icon={StorefrontRoundedIcon}
          />
        </Grid>
        <Grid item size={{ xs: 20, md: 4 }}>
          <StatCard
            title="All Items"
            value={totals.items}
            icon={Inventory2RoundedIcon}
          />
        </Grid>
        <Grid item size={{ xs: 20, md: 4 }}>
          <StatCard
            title="Standard Listings"
            value={totals.standard}
            icon={Inventory2RoundedIcon}
          />
        </Grid>
        <Grid item size={{ xs: 20, md: 4 }}>
          <StatCard
            title="Ad Listings"
            value={totals.ads}
            icon={CampaignRoundedIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 9 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader title="Active Users per Month" />
            <Divider />
            <CardContent>
              <LineChart
                xAxis={[{ data: monthly.months }]}
                series={[
                  {
                    id: "activeMonthly",
                    label: "Active Users",
                    data: activeUsersMonthly,
                    area: true,
                    color: "#3b82f6"
                  }
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 3 }}>
          <StatCard
            title="Active Users (current)"
            value={activeUsersCurrent}
            icon={GroupRoundedIcon}
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader title="Listings by Month" />
            <Divider />
            <CardContent>
              <BarChart
                xAxis={[{ scaleType: "band", data: monthly.months }]}
                series={[
                  {
                    name: "Standard",
                    data: monthly.listingsStandard,
                    color: "#7b8cff"
                  },
                  { name: "Ads", data: monthly.listingsAds, color: "#ff8ccf" }
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader title="New Users by Month" />
            <Divider />
            <CardContent>
              <LineChart
                xAxis={[{ data: monthly.months }]}
                series={[
                  {
                    id: "active",
                    label: "New Users",
                    data: monthly.newUsers,
                    area: true,
                    color: "#22c55e"
                  },
                  {
                    id: "inactive",
                    label: "Inactive Users",
                    data: inactiveUsers,
                    area: false,
                    color: "#ef4444"
                  }
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid item size={{ xs: 12, md: 8 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader title="Transactions by Month" />
            <Divider />
            <CardContent>
              <BarChart
                xAxis={[{ scaleType: "band", data: monthly.months }]}
                series={[
                  {
                    name: "Transactions",
                    data: monthly.newUsers.map((n) => Math.round(n * 3.1)),
                    color: "#a855f7"
                  }
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ borderRadius: 2 }}>
            <CardHeader title="Ads vs Standard Listings" />
            <Divider />
            <CardContent>
              <PieChart
                series={[
                  {
                    data: [
                      { id: 0, value: totals.standard, label: "Standard" },
                      { id: 1, value: totals.ads, label: "Ads" }
                    ],
                    innerRadius: 40,
                    outerRadius: 110,
                    paddingAngle: 3
                  }
                ]}
                height={280}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
