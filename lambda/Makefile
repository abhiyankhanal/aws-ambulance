# Define variables
MODULE_NAME = lambda
S3_BUCKET = aws-ambulance-${MODULE_NAME}
KEY = lambda.zip
REGION = us-east-1

package:
	zip -r $(KEY) dist

upload: package
	aws s3 cp $(KEY) s3://$(S3_BUCKET)

deploy: upload
	aws lambda update-function-code --function-name aws-ambulance-${MODULE_NAME} --s3-bucket $(S3_BUCKET) --s3-key $(KEY) --region $(REGION)

