import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";

export default function StatCard({ title, value, icon: Icon, color = "primary", subtitle }) {
  return (
    <Card elevation={1} sx={{ borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark` }}>
            {Icon ? <Icon fontSize="small" /> : null}
          </Avatar>
          <Stack>
            <Typography variant="caption" color="text.secondary">{title}</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{value}</Typography>
            {subtitle ? (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            ) : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}


