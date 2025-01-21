# frontend

This document provides an overview of the workflow, accompanied by screenshots.

## Setting an Admin Password

The first time the app is started, you’ll be prompted to set an admin password. This password is stored in the database, which is mounted to a local volume and persists through container tear-downs.

![Screenshot of "set admin password" page](../screens/ss1_21012025.png)

## Choose a Platform

You’ll be prompted to select a platform to push notifications to.

![Screenshot of "choose platform" page](../screens/ss2_21012025.png)

For this example, we are selecting Microsoft Teams.

## Enter a Webhook

The application will prompt you to enter a webhook URL for the selected platform. A test message will be sent to verify connectivity.

![Screenshot of "enter webhook" page](../screens/ss3_21012025.png)

To help you generate a webhook URL, an accordion menu provides step-by-step instructions for the selected platform. Below is an example for creating a webhook for Teams

## Verify UltraDNS Telemetry

You’ll then be prompted to verify connectivity with UltraDNS. The app will automatically generate an endpoint URL that must be added to your UltraDNS account settings under "Notification Settings."

![Screenshot of "test connection" page](../screens/ss4_21012025.png)

Detailed instructions for navigating the UltraDNS UI can be accessed through the expandable accordion menu.

![Screenshot of "test connection" page with instructions expanded](../screens/ss5_21012025.png)

Once you click the "Test Connection" button in UltraDNS, the app will detect the response and proceed automatically to the Dashboard.

![Screenshot of successful test connection](../screens/ss6_21012025.png)

## Dashboard View

Upon successful configuration, the Dashboard displays a summary of your webhooks.

![Screenshot of dashboard](../screens/ss7_21012025.png)

## Adding Additional Webhooks

To add another webhook, click the "Add Webhook" button on the Dashboard. This will take you back to the setup workflow. For this example, Slack has been selected.

![Screenshot of Slack setup instructions](../screens/ss8_21012025.png)

The setup will once again enter a state where it waits for test telemetry to confirm the webhook connection.

![Screenshot of telemetry test page](../screens/ss9_21012025.png)

Use the provided endpoint in your UltraDNS settings.

![Screenshot of UltraDNS UI](../screens/ss10_21012025.png)

Once confirmed, all configured webhooks will appear in the Dashboard view.

![Screenshot of dashboard with two webhooks](../screens/ss11_21012025.png)

## Logging In

After setting the admin password, you’ll need to log in using the password on subsequent visits.

![Screenshot of successful connection and dashboard](../screens/ss12_21012025.png)