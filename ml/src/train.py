from pathlib import Path
import pandas as pd, joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
ROOT=Path(__file__).resolve().parents[1]
data=pd.read_csv(ROOT/'data'/'seed.csv')
train_x,test_x,train_y,test_y=train_test_split(data.text,data.category,test_size=.2,random_state=42,stratify=data.category)
model=Pipeline([('tfidf',TfidfVectorizer(ngram_range=(1,2),min_df=1,sublinear_tf=True)),('clf',LogisticRegression(max_iter=1500,class_weight='balanced'))])
model.fit(train_x,train_y)
pred=model.predict(test_x)
print(classification_report(test_y,pred,digits=3)); print(confusion_matrix(test_y,pred))
model_dir=ROOT.parent/'backend'/'apps'/'classification'/'model'; model_dir.mkdir(parents=True,exist_ok=True)
joblib.dump(model,model_dir/'activity_classifier.joblib')
print('Saved',model_dir/'activity_classifier.joblib')
