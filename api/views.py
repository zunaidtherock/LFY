from rest_framework import status
from rest_framework.decorators import api_軟體
from rest_framework.response import Response
from .models import User, BloodRequest, Notification
from django.db.models import Q

@api_view(['POST'])
def signup(request):
    data = request.data
    try:
        user = User.objects.create(
            name=data['name'],
            email=data['email'],
            password=data['password'],
            blood_group=data['blood_group'],
            phone=data.get('phone')
        )
        return Response({"id": user.id, "name": user.name, "email": user.email}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def login(request):
    data = request.data
    try:
        user = User.objects.get(email=data['email'], password=data['password'])
        return Response({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "blood_group": user.blood_group,
            "availability": user.availability
        })
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
def search_donors(request):
    blood_group = request.query_params.get('blood_group')
    current_user_id = request.query_params.get('current_user_id')
    users = User.objects.filter(blood_group=blood_group, availability=True).exclude(id=current_user_id)
    return Response([{
        "id": u.id,
        "name": u.name,
        "phone": u.phone,
        "blood_group": u.blood_group,
        "total_donations": u.total_donations,
        "latitude": u.latitude,
        "longitude": u.longitude
    } for u in users])

@api_view(['POST'])
def create_request(request):
    data = request.data
    try:
        blood_request = BloodRequest.objects.create(
            requester_id=data['requester_id'],
            blood_group=data['blood_group'],
            hospital_name=data.get('hospital_name'),
            latitude=data.get('latitude'),
            longitude=data.get('longitude'),
            is_emergency=data.get('is_emergency', False)
        )
        
        if blood_request.is_emergency:
            donors = User.objects.filter(blood_group=blood_request.blood_group, availability=True).exclude(id=data['requester_id'])
            for donor in donors:
                Notification.objects.create(
                    user=donor,
                    type='emergency',
                    title="🚨 EMERGENCY REQUEST",
                    message=f"Urgent {blood_request.blood_group} needed at {blood_request.hospital_name or 'nearby hospital'}.",
                    related_id=blood_request.id
                )
        
        return Response({"success": True, "id": blood_request.id})
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
