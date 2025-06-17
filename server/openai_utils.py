import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_openai_response(user_input, location=None, profile=None):
    system_prompt = (
        "You are a friendly, knowledgeable local city guide. "
        "Provide unique and personalised suggestions to help a traveller explore and enjoy their current city, with clear walking directions from each location to the next."
    )

    if location:
        system_prompt += f"\nCurrent location: {location}"
    if profile:
        system_prompt += f"\nUser preferences: {profile}"

    response = client.chat.completions.create(
        model="gpt-4o",  # or "gpt-3.5-turbo"
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_input}
        ],
        temperature=0.85
    )
    return response.choices[0].message.content
