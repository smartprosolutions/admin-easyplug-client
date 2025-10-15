import React from "react";
import {
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  Divider,
  Badge,
  IconButton,
  Stack,
  Button
} from "@mui/material";
import MarkunreadIcon from "@mui/icons-material/Markunread";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const sampleMessages = [
  {
    id: 1,
    from: "Support",
    subject: "Welcome to EasyPlug",
    preview: "Thanks for joining EasyPlug! Here's how to get started...",
    time: "2d",
    unread: true
  },
  {
    id: 2,
    from: "Billing",
    subject: "Invoice #2025-09",
    preview: "Your invoice for September is ready.",
    time: "5d",
    unread: false
  },
  {
    id: 3,
    from: "Seller Team",
    subject: "New listing approved",
    preview: "Your product listing 'Fast Charger' has been approved.",
    time: "1w",
    unread: true
  }
];

export default function Messages() {
  return (
    <Box sx={{ width: "100%", py: 3 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h5">Messages</Typography>
            <Button variant="contained" startIcon={<MarkunreadIcon />}>
              New Message
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 0 }} elevation={1}>
          <List>
            {sampleMessages.map((m) => (
              <React.Fragment key={m.id}>
                <ListItem
                  secondaryAction={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {m.time}
                      </Typography>
                      <IconButton edge="end" size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </Stack>
                  }
                >
                  <ListItemAvatar>
                    <Badge
                      color="error"
                      variant="dot"
                      invisible={!m.unread}
                      overlap="circular"
                    >
                      <Avatar>{m.from.charAt(0)}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Typography variant="subtitle2">{m.subject}</Typography>
                        {m.unread && <Badge color="error" badgeContent={""} />}
                      </Box>
                    }
                    secondary={m.preview}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>
    </Box>
  );
}
