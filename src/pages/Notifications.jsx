import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CheckIcon from "@mui/icons-material/Check";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import EmailIcon from "@mui/icons-material/Email";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";

export default function Notifications() {
  const [filter, setFilter] = useState("all");
  const data = useMemo(
    () => [
      {
        id: 1,
        type: "system",
        title: "System update",
        body: "We will perform maintenance at 02:00.",
        time: "2h ago"
      },
      {
        id: 2,
        type: "message",
        title: "New message",
        body: "You’ve received a message from John.",
        time: "4h ago"
      },
      {
        id: 3,
        type: "warning",
        title: "Payment failed",
        body: "Your last payment could not be processed.",
        time: "Yesterday"
      },
      {
        id: 4,
        type: "promo",
        title: "Limited offer",
        body: "Save 20% on sponsorships this week!",
        time: "2 days ago"
      }
    ],
    []
  );
  const filtered = data.filter((n) =>
    filter === "all" ? true : n.type === filter
  );

  const typeChip = (t) => {
    switch (t) {
      case "system":
        return (
          <Chip
            size="small"
            icon={<NotificationsActiveIcon />}
            label="System"
            color="info"
          />
        );
      case "message":
        return (
          <Chip
            size="small"
            icon={<EmailIcon />}
            label="Message"
            color="primary"
            variant="outlined"
          />
        );
      case "warning":
        return (
          <Chip
            size="small"
            icon={<WarningAmberIcon />}
            label="Warning"
            color="warning"
          />
        );
      case "promo":
        return (
          <Chip
            size="small"
            icon={<LocalOfferIcon />}
            label="Promo"
            color="success"
            variant="outlined"
          />
        );
      default:
        return <Chip size="small" label={t} />;
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5">Notifications</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button onClick={() => setFilter("system")}>System</Button>
          <Button onClick={() => setFilter("message")}>Messages</Button>
          <Button onClick={() => setFilter("warning")}>Warnings</Button>
          <Button onClick={() => setFilter("promo")}>Promos</Button>
        </Stack>
      </Stack>
      <Paper sx={{ p: 2 }} elevation={3}>
        <List>
          {filtered.map((n, idx) => (
            <React.Fragment key={n.id}>
              <ListItem
                secondaryAction={
                  <Stack direction="row" spacing={1}>
                    {typeChip(n.type)}
                    <IconButton size="small" color="success">
                      <CheckIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Stack>
                }
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: "primary.main" }}>
                    {n.title.charAt(0)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={n.title}
                  secondary={`${n.body} • ${n.time}`}
                />
              </ListItem>
              {idx < filtered.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
}
