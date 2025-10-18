if python doesn't work do this
echo 'alias python=python3' >> ~/.zshrc
do this
cd backend
python -m venv .venv
source venv/bin/activate
python -m pip install -r requirements.txt

chmod +x start_all.sh

./start_all.sh
