# Information Required From Company IT

Provide the following before live Dynamics, notification, email, and production deployment verification.

## Microsoft Dynamics 365 / Dataverse

- Confirmation that the CRM is Microsoft Dynamics 365 backed by Dataverse
- Dynamics environment URL
- Microsoft Entra tenant ID
- Approved app registration and client ID
- Approved authentication method: client secret or certificate
- Client secret value or certificate deployment process
- Dataverse application user
- Assigned Dataverse security role
- API access approval
- Test/sandbox and production environment access
- Expected synchronization volume and number of instructors

## Dataverse Mapping

- Course table logical name
- Instructor table logical name
- Assignment table logical name
- Availability table or storage decision
- Column logical names for all fields in `config/dynamics-mapping.example.json`
- Lookup relationship names for course-to-assignment and instructor-to-assignment
- Choice-field values for course status, assignment status, delivery type, and instructor status
- Course reference-number format and uniqueness rules
- Instructor employee ID format and uniqueness rules

## Webhooks And Sync

- Approved webhook registration method: Dataverse webhook, Power Automate flow, or scheduled sync only
- Webhook registration assistance and allowed headers
- Shared-secret or Microsoft Entra validation requirements
- IP allowlisting requirements
- Missed-event recovery requirements

## Security And Privacy

- Course attendee fields that instructors may view
- Data retention requirements
- Backup and recovery requirements
- Mobile-device-management requirements
- Single sign-on requirements, if any
- Privacy review owner
- IT support contact
